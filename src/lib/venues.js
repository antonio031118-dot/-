import { C } from "../theme.js";

// Catálogo de locales de ocio nocturno. La lista COMPLETA se descarga en vivo
// desde OpenStreetMap (discotecas, bares y pubs con coordenadas reales) en el
// navegador; esta lista curada es solo el respaldo para que nunca esté vacío.

export const slug = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const venueId = (city, name) => `${city}-${slug(name)}`;

export function typeLabel(key) {
  if (key === "disco") return "Discoteca";
  if (key === "pub") return "Pub";
  return "Bar";
}
export function typeColor(key) {
  if (key === "disco") return C.magenta;
  if (key === "pub") return C.amber;
  return C.violet;
}

// amenity de OSM -> tipo interno.
function typeKeyOf(amenity) {
  if (amenity === "nightclub") return "disco";
  if (amenity === "pub") return "pub";
  return "bar";
}

// ---- respaldo curado (coordenadas aproximadas; OSM las corrige en vivo) ----
const RAW = {
  madrid: [
    { name: "Teatro Kapital", lat: 40.4088, lng: -3.6936, typeKey: "disco", area: "Atocha" },
    { name: "Joy Madrid", lat: 40.4166, lng: -3.7076, typeKey: "disco", area: "Sol" },
    { name: "Teatro Barceló", lat: 40.4270, lng: -3.6997, typeKey: "disco", area: "Barceló" },
    { name: "Fabrik", lat: 40.2833, lng: -3.7936, typeKey: "disco", area: "Fuenlabrada" },
    { name: "Mondo Disko", lat: 40.4203, lng: -3.6836, typeKey: "disco", area: "Goya" },
    { name: "Shôko Madrid", lat: 40.4074, lng: -3.7000, typeKey: "disco", area: "La Latina" },
    { name: "Independance Club", lat: 40.4207, lng: -3.7020, typeKey: "disco", area: "Fuencarral" },
    { name: "Opium Madrid", lat: 40.4368, lng: -3.6905, typeKey: "disco", area: "Chamberí" },
    { name: "Changó", lat: 40.4290, lng: -3.6975, typeKey: "disco", area: "Alonso Martínez" },
    { name: "LAB The Club", lat: 40.4180, lng: -3.7060, typeKey: "disco", area: "Callao" },
    { name: "Gabana", lat: 40.4330, lng: -3.6850, typeKey: "disco", area: "Salamanca" },
    { name: "Marula Café", lat: 40.4110, lng: -3.7080, typeKey: "bar", area: "La Latina" },
  ],
  cordoba: [
    { name: "Long Rock", lat: 37.8832, lng: -4.7795, typeKey: "disco", area: "La Ribera", terraza: true },
    { name: "Aduana", lat: 37.8838, lng: -4.7762, typeKey: "disco", area: "La Ribera" },
    { name: "Sojo Ribera", lat: 37.8829, lng: -4.7781, typeKey: "bar", area: "La Ribera", terraza: true },
    { name: "Hangar", lat: 37.8600, lng: -4.8000, typeKey: "disco", area: "Polígono" },
    { name: "Sala Góngora", lat: 37.8795, lng: -4.7792, typeKey: "disco", area: "Centro" },
  ],
  puerto: [
    { name: "Momart Theatre", lat: 36.6030, lng: -6.2170, typeKey: "disco", area: "Ctra. Sanlúcar" },
    { name: "Chiringuito Valdelagrana", lat: 36.5780, lng: -6.2150, typeKey: "bar", area: "Valdelagrana", terraza: true },
    { name: "Puerto Sherry", lat: 36.5760, lng: -6.2450, typeKey: "bar", area: "Marina", terraza: true },
    { name: "Sala Bahía", lat: 36.5940, lng: -6.2330, typeKey: "disco", area: "Centro" },
  ],
};

function build(city, arr) {
  return arr.map((v) => ({
    id: venueId(city, v.name),
    name: v.name, lat: v.lat, lng: v.lng,
    typeKey: v.typeKey, type: typeLabel(v.typeKey),
    terraza: !!v.terraza, area: v.area || "",
  }));
}

export const SEED = {
  madrid: build("madrid", RAW.madrid),
  cordoba: build("cordoba", RAW.cordoba),
  puerto: build("puerto", RAW.puerto),
};

// ---- descarga en vivo desde OpenStreetMap (Overpass) ----
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Bounding box (S,W,N,E) por ciudad. Mucho más rápido que la consulta por área.
const BBOX = {
  madrid: "40.25,-3.90,40.52,-3.55",
  cordoba: "37.82,-4.86,37.93,-4.72",
  puerto: "36.54,-6.30,36.64,-6.17",
};

async function runQuery(query) {
  const body = "data=" + encodeURIComponent(query);
  for (const url of ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 45000);
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
      id: venueId(city, name), name, lat, lng,
      typeKey: key, type: typeLabel(key),
      terraza: t.outdoor_seating === "yes" || t.outdoor_seating === "terrace" || /terraza/i.test(name),
      area: t["addr:suburb"] || t["addr:neighbourhood"] || t["addr:district"] || t["addr:city"] || "",
    };
    if (!byId.has(v.id)) byId.set(v.id, v);
  }
  return [...byId.values()];
}

// Descarga los locales de la ciudad. Devuelve null si no se pudo (se usará SEED).
// Dos tandas: primero discotecas (prioritario, seguro) y luego bares/pubs, para
// que las discotecas salgan aunque la consulta de bares sea pesada o falle.
export async function fetchVenues(city) {
  const b = BBOX[city];
  if (!b) return null;
  const q = (amenity) => `[out:json][timeout:60];nwr["amenity"~"^(${amenity})$"](${b});out center tags;`;
  const clubs = await runQuery(q("nightclub"));
  const barsPubs = await runQuery(q("bar|pub"));
  if (clubs == null && barsPubs == null) return null;
  const list = normalize(city, [...(clubs || []), ...(barsPubs || [])]);
  return list.length ? list : null;
}

// Combina en vivo + respaldo, sin duplicar (los de OSM mandan por coordenadas).
export function mergeVenues(seed, live) {
  if (!live?.length) return seed;
  const byId = new Map(live.map((v) => [v.id, v]));
  for (const v of seed) if (!byId.has(v.id)) byId.set(v.id, v);
  return [...byId.values()];
}

export function matchFilter(v, key) {
  if (key === "all") return true;
  if (key === "terraza") return !!v.terraza;
  return v.typeKey === key;
}
