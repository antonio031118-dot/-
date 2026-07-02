import React from "react";
import { ChevronDown, Share2, Music2, Sun, Check, Users } from "lucide-react";
import { C, grad, iconBtn } from "../theme.js";
import { cityName, GENRES } from "../data.js";
import { vibe, initials } from "../lib/util.js";
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

export function ChipRow({ genre, setGenre }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "0 16px 12px", overflowX: "auto" }}>
      {GENRES.map((g) => {
        const on = g === genre;
        return (
          <button key={g} onClick={() => setGenre(g)} style={{
            flexShrink: 0, fontSize: 13, padding: "7px 14px", borderRadius: 20, cursor: "pointer",
            border: on ? "none" : `1px solid ${C.border}`, background: on ? C.text : "transparent",
            color: on ? C.bg : C.sub, fontWeight: on ? 600 : 500,
          }}>{g}</button>
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
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{club.name}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
            <Music2 size={13} /> {club.genres.join(" · ")}
            {club.terraza && <span style={{ marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 3, color: C.teal }}><Sun size={12} /> terraza</span>}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, color: v.color, background: `${v.color}1f` }}>{v.label}</span>
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
