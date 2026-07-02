import React, { useState } from "react";
import { ChevronLeft, Check, Send, ShieldCheck, MessageCircle, UserPlus, Sun, PartyPopper, Ticket, Clock, Pencil, Plus } from "lucide-react";
import { C, grad, inputStyle, primaryBtn, iconBtn } from "../theme.js";
import { typeColor } from "../lib/venues.js";
import { Avatar, SectionTitle } from "./ui.jsx";

export default function ClubDetail({ club, going, posts, me, friendIds, event, onEditEvent, onBack, onVoy, onPost, onChat, onAddFriend }) {
  const [txt, setTxt] = useState("");
  const imHere = going.some((x) => x.id === me.id);

  const send = () => {
    if (txt.trim()) { onPost(txt); setTxt(""); }
  };

  return (
    <div>
      <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={iconBtn} aria-label="Volver"><ChevronLeft size={20} color={C.text} /></button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{club.name}</div>
          <div style={{ fontSize: 12.5, color: C.sub, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: typeColor(club.typeKey), fontWeight: 600 }}>{club.type}</span>
            {club.area && <span>· {club.area}</span>}
            {club.terraza && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.teal }}><Sun size={12} /> terraza</span>}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {event ? (
          <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.magenta}`, marginBottom: 16 }}>
            {event.flyer && (
              <div style={{ height: 150, background: `#000 center/cover no-repeat url(${JSON.stringify(event.flyer)})` }} />
            )}
            <div style={{ padding: 14, background: `${C.magenta}12` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.magenta, display: "inline-flex", alignItems: "center", gap: 4 }}><PartyPopper size={13} /> FIESTA DE HOY</span>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{event.title}</div>
                  {event.time && <div style={{ fontSize: 13, color: C.sub, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} /> {event.time}</div>}
                </div>
                <button onClick={onEditEvent} style={{ ...iconBtn, width: 34, height: 34 }} aria-label="Editar fiesta"><Pencil size={15} color={C.sub} /></button>
              </div>
              {event.ticket && (
                <a href={event.ticket} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", ...primaryBtn, width: "100%", boxSizing: "border-box", marginTop: 12 }}>
                  <Ticket size={15} /> Comprar entradas
                </a>
              )}
            </div>
          </div>
        ) : (
          <button onClick={onEditEvent} style={{ width: "100%", marginBottom: 16, padding: "11px", borderRadius: 12, cursor: "pointer", border: `1px dashed ${C.borderStrong}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={16} /> Publicar la fiesta de esta noche
          </button>
        )}

        <button onClick={onVoy} style={{ ...primaryBtn, width: "100%", background: imHere ? grad : "transparent", color: imHere ? "#fff" : C.text, boxShadow: imHere ? "none" : `inset 0 0 0 1px ${C.borderStrong}`, marginBottom: 18 }}>
          <Check size={15} style={{ verticalAlign: -3, marginRight: 6 }} />{imHere ? "Vas aquí esta noche" : "Marcar que voy"}
        </button>

        <SectionTitle>Quién va ({going.length})</SectionTitle>
        {going.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 18px" }}>Todavía nadie ha marcado este sitio.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "0 0 18px" }}>
            {going.map((p) => {
              const isMe = p.id === me.id;
              const isFriend = friendIds.has(p.id);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 10px" }}>
                  <Avatar id={p.id} name={p.name} size={30} ring={C.card} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {p.name}{isMe ? " (tú)" : ""}
                      {!isMe && isFriend && <span style={{ color: C.teal, fontWeight: 600, fontSize: 12 }}> · amigo</span>}
                    </div>
                  </div>
                  {!isMe && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {!isFriend && (
                        <button onClick={() => onAddFriend(p)} style={miniBtn} aria-label="Añadir amigo">
                          <UserPlus size={15} color={C.sub} />
                        </button>
                      )}
                      <button onClick={() => onChat(p)} style={{ ...miniBtn, background: grad, border: "none" }} aria-label="Escribir">
                        <MessageCircle size={15} color="#fff" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <SectionTitle>Previa abierta</SectionTitle>
        <p style={{ color: C.sub, fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>
          Tablón público para los que vais. ¿Montas o buscas previa? Déjalo aquí, o escríbele directo a alguien de la lista de arriba.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ej: previa en mi casa a las 23h, ¡vente!" style={{ ...inputStyle, marginBottom: 0 }} />
          <button onClick={send} style={{ ...iconBtn, background: grad, width: 44, border: "none" }} aria-label="Publicar"><Send size={17} color="#fff" /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 11.5, marginBottom: 16 }}>
          <ShieldCheck size={13} color={C.teal} /> Quedad siempre en un sitio público y con tu gente cerca.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Sé el primero en proponer plan.</p>
          ) : posts.slice().reverse().map((p, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, color: C.violet, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.4 }}>{p.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const miniBtn = {
  width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
