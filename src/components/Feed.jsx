import React from "react";
import { ChevronDown, Share2, Sun, Check, Users, MapPin, Search } from "lucide-react";
import { C, grad, iconBtn, inputStyle } from "../theme.js";
import { cityName, FILTERS } from "../data.js";
import { vibe, initials } from "../lib/util.js";
import { typeColor } from "../lib/venues.js";
import { AvatarStack } from "./ui.jsx";

export function Header({ me, city, onCity, onShare }) {
  return (
    <div style={{ padding: "18px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <button onClick={onCity} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, color: C.muted }}>
          <span style={{ fontSize: 12, letterSpacing: 0.5 }}>Esta noche · {cityName(city)}</span>
          <ChevronDown size={13} />
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "2px 0 0" }}>¿A dónde vamos?</h1>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onShare} style={iconBtn} aria-label="Compartir"><Share2 size={18} color={C.sub} /></button>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{initials(me.name)}</div>
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange }) {
  return (
    <div style={{ padding: "0 16px 10px", position: "relative" }}>
      <Search size={16} color={C.muted} style={{ position: "absolute", left: 28, top: 12 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Buscar discoteca, bar o zona…"
        style={{ ...inputStyle, marginBottom: 0, paddingLeft: 38 }} />
    </div>
  );
}

export function Filters({ filter, setFilter }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "0 16px 12px", overflowX: "auto" }}>
      {FILTERS.map((f) => {
        const on = f.key === filter;
        return (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            flexShrink: 0, fontSize: 13, padding: "7px 14px", borderRadius: 20, cursor: "pointer",
            border: on ? "none" : `1px solid ${C.border}`, background: on ? C.text : "transparent",
            color: on ? C.bg : C.sub, fontWeight: on ? 600 : 500,
          }}>{f.label}</button>
        );
      })}
    </div>
  );
}

export function ClubCard({ club, going, me, friendIds, onOpen, onVoy }) {
  const count = going.length;
  const v = vibe(count);
  const imHere = going.some((x) => x.id === me.id);
  const friendsHere = going.filter((x) => x.id !== me.id && friendIds.has(x.id));

  return (
    <div style={{ background: C.card, border: `1px solid ${imHere ? C.magenta : C.border}`, borderRadius: 16, padding: 14 }}>
      <div onClick={onOpen} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{club.name}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: typeColor(club.typeKey), fontWeight: 600 }}>{club.type}</span>
            {club.area && <span>· {club.area}</span>}
            {club.terraza && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.teal }}><Sun size={12} /> terraza</span>}
          </div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, color: v.color, background: `${v.color}1f` }}>{v.label}</span>
      </div>

      <div onClick={onOpen} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 9, marginTop: 12, minHeight: 26 }}>
        {count > 0 ? (
          <>
            <AvatarStack going={going} />
            <span style={{ fontSize: 12.5, color: C.sub }}>
              {count} {count === 1 ? "persona va" : "personas van"}
              {friendsHere.length > 0 && (
                <span style={{ color: C.teal, fontWeight: 600 }}>
                  {" · "}{friendsHere.length} {friendsHere.length === 1 ? "amigo" : "amigos"}
                </span>
              )}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12.5, color: C.muted }}>Aún nadie. Sé el primero en marcar 👀</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
        <button onClick={onVoy} style={{
          flex: 1, fontSize: 13.5, fontWeight: 600, padding: "9px", borderRadius: 11, cursor: "pointer", border: "none",
          background: imHere ? grad : "transparent", color: imHere ? "#fff" : C.text,
          boxShadow: imHere ? "none" : `inset 0 0 0 1px ${C.borderStrong}`,
        }}>
          <Check size={14} style={{ verticalAlign: -2, marginRight: 5 }} />{imHere ? "Vas aquí" : "Voy"}
        </button>
        <button onClick={onOpen} style={{ flex: 1, fontSize: 13.5, fontWeight: 600, padding: "9px", borderRadius: 11, cursor: "pointer", border: "none", background: "transparent", color: C.text, boxShadow: `inset 0 0 0 1px ${C.borderStrong}` }}>
          <Users size={14} style={{ verticalAlign: -2, marginRight: 5 }} />Buscar previa
        </button>
      </div>
    </div>
  );
}
