import React from "react";
import { MapPin, ChevronDown, Share2, Users } from "lucide-react";
import { C, grad, primaryBtn } from "../theme.js";
import { cityName } from "../data.js";
import { initials } from "../lib/util.js";
import { SectionTitle } from "./ui.jsx";

export default function Profile({ me, city, myCode, goingTo, friendCount, onShare, onCity, onReset }) {
  return (
    <div style={{ padding: "22px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>{initials(me.name)}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{me.name}</div>
          <button onClick={onCity} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, cursor: "pointer", color: C.muted, fontSize: 13 }}>
            <MapPin size={12} /> {cityName(city)} <ChevronDown size={12} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <Stat label="Código" value={myCode} accent />
        <Stat label="Amigos" value={friendCount} />
        <Stat label="Vas a" value={goingTo.length} />
      </div>

      <SectionTitle>Esta noche vas a</SectionTitle>
      {goingTo.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 22px" }}>Aún no has marcado ningún sitio.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 22px" }}>
          {goingTo.map((c) => <span key={c.id} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 20, background: `${C.magenta}1f`, color: C.magenta, fontWeight: 600 }}>{c.name}</span>)}
        </div>
      )}

      <button onClick={onShare} style={{ ...primaryBtn, width: "100%", background: grad, color: "#fff", marginBottom: 10 }}>
        <Share2 size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Invitar a mi grupo
      </button>
      <button onClick={onReset} style={{ ...primaryBtn, width: "100%", background: "transparent", color: C.sub, boxShadow: `inset 0 0 0 1px ${C.border}` }}>
        Borrar mi asistencia de esta noche
      </button>
      <p style={{ color: C.muted, fontSize: 11.5, marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>
        La asistencia se reinicia sola cada mañana. Tus amigos y tu código se quedan.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: accent ? 18 : 22, fontWeight: 800, letterSpacing: accent ? 2 : 0, color: accent ? C.magenta : C.text }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}
