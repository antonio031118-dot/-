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
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

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

async function runQuery(query) {
  const body = "data=" + encodeURIComponent(query);
  for (const url of ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 50000);
      const r = await fetch(url, {
        method: "POST", body, signal: ctrl.signal,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      clearTimeout(to);
      if (!r.ok) continue;
      const j = await r.json();
      return j.elements || [];
    } catch { /* siguiente endpoint */ }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const city = String(req.query.city || "madrid").toLowerCase();
  const b = BBOX[city];
  if (!b) return res.status(400).json({ ok: false, error: "ciudad no válida" });

  const q = (amenity) => `[out:json][timeout:60];nwr["amenity"~"^(${amenity})$"](${b});out center tags;`;
  const [clubs, barsPubs] = await Promise.all([runQuery(q("nightclub")), runQuery(q("bar|pub"))]);
  if (clubs == null && barsPubs == null) {
    return res.status(502).json({ ok: false, error: "OpenStreetMap no respondió" });
  }
  const venues = normalize(city, [...(clubs || []), ...(barsPubs || [])]);
  const discos = venues.filter((v) => v.typeKey === "disco").length;

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).json({ ok: true, city, count: venues.length, discos, venues });
}
