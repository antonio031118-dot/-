// Función serverless (Vercel) que intenta leer las fiestas de Fourvenues por
// ciudad y devolverlas normalizadas. Corre en el servidor (no en el navegador)
// para saltar el CORS; incluye modo ?debug=1 para diagnosticar qué se recibe.
//
// AVISO: leer la web pública de Fourvenues puede ir contra sus Términos de Uso
// y es frágil. Es para PROBAR. La vía estable es su API oficial con credenciales.

const CITY_SLUGS = {
  madrid: ["discotecas-madrid"],
  cordoba: ["discotecas-cordoba"],
  puerto: ["discotecas-el-puerto-de-santa-maria", "discotecas-el-puerto"],
};

const HOSTS = ["https://site.fourvenues.com", "https://web.fourvenues.com"];

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9",
  "Upgrade-Insecure-Requests": "1",
};

async function tryFetch(url) {
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow" });
    const text = await r.text();
    return { url, status: r.status, ok: r.ok, text };
  } catch (e) {
    return { url, status: 0, ok: false, error: String(e) };
  }
}

// Extrae eventos de los bloques JSON-LD (schema.org Event), lo más fiable.
function eventsFromJsonLd(html) {
  const events = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const items = [];
    const walk = (x) => {
      if (!x) return;
      if (Array.isArray(x)) return x.forEach(walk);
      if (typeof x === "object") {
        if (x["@graph"]) walk(x["@graph"]);
        const t = x["@type"];
        if (t && (t === "Event" || (Array.isArray(t) && t.includes("Event")) || /Event/.test(t))) items.push(x);
      }
    };
    walk(data);
    for (const ev of items) {
      const loc = ev.location || {};
      events.push({
        name: ev.name || "",
        start: ev.startDate || ev.startTime || "",
        venue: (typeof loc === "object" ? loc.name : loc) || "",
        address: loc.address ? (typeof loc.address === "object" ? loc.address.streetAddress : loc.address) : "",
        url: ev.url || (Array.isArray(ev.offers) ? ev.offers[0]?.url : ev.offers?.url) || "",
        image: Array.isArray(ev.image) ? ev.image[0] : ev.image || "",
      });
    }
  }
  return events;
}

// Extrae el JSON incrustado de frameworks (Next/Nuxt) por si no hay JSON-LD.
function embeddedBlob(html) {
  const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (next) return { kind: "__NEXT_DATA__", json: safeParse(next[1]) };
  const nuxt = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i);
  if (nuxt) return { kind: "__NUXT__", json: safeParse(nuxt[1]) };
  return null;
}
function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const city = String(req.query.city || "madrid").toLowerCase();
  const debug = req.query.debug === "1";
  const customSlug = req.query.slug ? [String(req.query.slug)] : null;
  const slugs = customSlug || CITY_SLUGS[city] || CITY_SLUGS.madrid;

  const attempts = [];
  let best = null;

  for (const slug of slugs) {
    for (const host of HOSTS) {
      for (const suffix of ["/events", ""]) {
        const url = `${host}/es/${slug}${suffix}`;
        const r = await tryFetch(url);
        const blocked = r.text ? /Just a moment|cf-challenge|Attention Required|Cloudflare/i.test(r.text) : false;
        const info = { url, status: r.status, ok: r.ok, blocked, length: r.text?.length || 0, error: r.error };
        attempts.push(info);
        if (r.ok && r.text && !blocked) {
          const events = eventsFromJsonLd(r.text);
          if (events.length || !best) best = { url, html: r.text, events };
          if (events.length) { best = { url, html: r.text, events }; break; }
        }
      }
      if (best?.events?.length) break;
    }
    if (best?.events?.length) break;
  }

  if (!best) {
    return res.status(502).json({ ok: false, city, error: "no se pudo leer Fourvenues", attempts });
  }

  const events = best.events;
  if (debug) {
    const blob = embeddedBlob(best.html);
    return res.status(200).json({
      ok: true, city, source: best.url, eventCount: events.length, events,
      diagnostics: {
        attempts,
        htmlLength: best.html.length,
        jsonLdBlocks: (best.html.match(/application\/ld\+json/g) || []).length,
        embedded: blob ? { kind: blob.kind, hasJson: !!blob.json } : null,
        htmlHead: best.html.slice(0, 600),
      },
    });
  }

  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  return res.status(200).json({ ok: true, city, source: best.url, events });
}
