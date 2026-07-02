// Función serverless (Vercel) que trae los locales de ocio nocturno de una
// ciudad desde OpenStreetMap (Overpass) y los devuelve normalizados. Correr en
// el servidor es más fiable que hacerlo desde el navegador y permite cachear en
// el edge (una sola descarga compartida por todos los usuarios).

const BBOX = {
  madrid: "40.25,-3.90,40.52,-3.55",
  cordoba: "37.82,-4.86,37.93,-4.72",
  puerto: "36.54,-6.30,36.64,-6.17",
};

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Overpass exige identificar la aplicación; sin User-Agent devuelve 406.
const OVERPASS_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "SalgoApp/1.0 (red social de fiesta; contacto: antonio031118@gmail.com)",
  Accept: "application/json",
};

const slug = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function typeLabel(key) {
  if (key === "disco") return "Discoteca";
  if (key === "pub") return "Pub";
  return "Bar";
}
function typeKeyOf(amenity) {
  if (amenity === "nightclub") return "disco";
  if (amenity === "pub") return "pub";
  return "bar";
}

function normalize(city, elements) {
  const byId = new Map();
  for (const el of elements) {
    const name = el.tags?.name;
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const key = typeKeyOf(el.tags.amenity);
    const t = el.tags;
    const v = {
      id: `${city}-${slug(name)}`, name, lat, lng,
      typeKey: key, type: typeLabel(key),
      terraza: t.outdoor_seating === "yes" || t.outdoor_seating === "terrace" || /terraza/i.test(name),
      area: t["addr:suburb"] || t["addr:neighbourhood"] || t["addr:district"] || t["addr:city"] || "",
    };
    if (!byId.has(v.id)) byId.set(v.id, v);
  }
  return [...byId.values()];
}

export const maxDuration = 60; // Vercel: dar margen a Overpass

// Formato explícito (node/way/relation): compatible con todos los servidores.
function buildQuery(amenity, b, timeout) {
  const sel = `["amenity"~"^(${amenity})$"]`;
  return `[out:json][timeout:${timeout}];(node${sel}(${b});way${sel}(${b});relation${sel}(${b}););out center tags;`;
}

// Prueba los servidores en orden; éxito solo si devuelve elementos (>0).
async function runQuery(query, timeoutMs, attempts) {
  const body = "data=" + encodeURIComponent(query);
  for (const url of ENDPOINTS) {
    const host = new URL(url).host;
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), timeoutMs);
      const r = await fetch(url, { method: "POST", body, signal: ctrl.signal, headers: OVERPASS_HEADERS });
      clearTimeout(to);
      if (!r.ok) { attempts.push({ host, status: r.status }); continue; }
      const j = await r.json();
      const els = j.elements || [];
      attempts.push({ host, status: 200, count: els.length, remark: j.remark ? String(j.remark).slice(0, 90) : undefined });
      if (els.length) return els;
    } catch (e) {
      attempts.push({ host, error: String(e).slice(0, 90) });
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const city = String(req.query.city || "madrid").toLowerCase();
  const debug = req.query.debug === "1";
  const b = BBOX[city];
  if (!b) return res.status(400).json({ ok: false, error: "ciudad no válida" });

  const attempts = [];
  // 1) intento completo (discotecas + bares + pubs)
  let els = await runQuery(buildQuery("nightclub|bar|pub", b, 45), 48000, attempts);
  // 2) plan de emergencia: al menos las discotecas (consulta pequeña y rápida)
  if (!els) els = await runQuery(buildQuery("nightclub", b, 25), 25000, attempts);

  if (!els) {
    return res.status(502).json({ ok: false, error: "OpenStreetMap no respondió", attempts });
  }

  const venues = normalize(city, els);
  const discos = venues.filter((v) => v.typeKey === "disco").length;

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  const payload = { ok: true, city, count: venues.length, discos, venues };
  if (debug) payload.diagnostics = { attempts };
  return res.status(200).json(payload);
}
