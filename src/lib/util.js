import { C } from "../theme.js";

const AVATAR_COLORS = ["#FF3D8B", "#8B5CF6", "#2DD4BF", "#FFB020", "#36D399", "#60A5FA", "#F472B6"];

export function colorFor(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name = "") {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}

export function vibe(count) {
  if (count >= 50) return { label: "Ambientazo", color: C.amber };
  if (count >= 20) return { label: "Llenando", color: C.magenta };
  if (count >= 1) return { label: "Arrancando", color: C.violet };
  return { label: "Tranqui", color: C.muted };
}

// "Día de fiesta": la noche pertenece al día anterior hasta las 6:00,
// para que la asistencia se reinicie sola cada mañana.
export function partyDay(d = new Date()) {
  const x = new Date(d);
  if (x.getHours() < 6) x.setDate(x.getDate() - 1);
  return x.toISOString().slice(0, 10);
}

// Código corto para añadir amigos (sin caracteres ambiguos).
export function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function newId(prefix = "u") {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

// Id de conversación 1-a-1 estable e independiente del orden.
export function convoId(a, b) {
  return [a, b].sort().join("__");
}

export function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "ahora";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}
