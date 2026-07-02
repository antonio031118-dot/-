// Paleta y estilos compartidos de Salgo.
export const C = {
  bg: "#0B0A12", card: "#16131F", raised: "#1E1A2B",
  border: "rgba(255,255,255,0.08)", borderStrong: "rgba(255,255,255,0.16)",
  text: "#F4F1FA", sub: "#A9A2BD", muted: "#6E6885",
  magenta: "#FF3D8B", violet: "#8B5CF6", amber: "#FFB020", teal: "#2DD4BF", green: "#36D399",
};

export const grad = "linear-gradient(135deg, #FF3D8B 0%, #8B5CF6 100%)";

export const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
  background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, outline: "none",
};
export const labelStyle = {
  fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.muted, fontWeight: 600, marginBottom: 8,
};
export const primaryBtn = {
  padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
  background: grad, color: "#fff", fontSize: 15, fontWeight: 600,
};
export const iconBtn = {
  width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
