import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, MessageCircle, ShieldCheck } from "lucide-react";
import { C, grad, inputStyle, iconBtn } from "../theme.js";
import { Avatar, SectionTitle, Placeholder } from "./ui.jsx";
import { timeAgo } from "../lib/util.js";

export function MessagesTab({ convos, goingTo, previa, me, onOpenChat, onOpenClub }) {
  return (
    <div style={{ padding: "18px 16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Previas</h2>
      <p style={{ color: C.sub, fontSize: 13.5, margin: "0 0 18px" }}>Tus chats para cuadrar plan y los sitios donde vas.</p>

      <SectionTitle>Chats</SectionTitle>
      {convos.length === 0 ? (
        <Placeholder inline icon={<MessageCircle size={24} color={C.violet} />} title="Sin chats todavía" text="Escríbele a alguien que vaya a tu misma discoteca o a un amigo para montar la previa." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {convos.map((c) => (
            <div key={c.withId} onClick={() => onOpenChat(c)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: C.card, border: `1px solid ${c.unread ? C.magenta : C.border}`, borderRadius: 14, padding: 12 }}>
              <Avatar id={c.withId} name={c.withName} size={40} ring={C.card} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{c.withName}</span>
                  <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{timeAgo(c.lastTs)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: c.unread ? C.text : C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.lastFrom === me.id ? "Tú: " : ""}{c.lastText}
                </div>
              </div>
              {c.unread > 0 && <span style={{ width: 9, height: 9, borderRadius: 5, background: C.magenta, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}

      <SectionTitle>Esta noche vas a</SectionTitle>
      {goingTo.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 13.5, margin: 0 }}>Marca "Voy" en alguna discoteca y aquí verás su previa.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {goingTo.map((c) => (
            <div key={c.id} onClick={() => onOpenClub(c.id)} style={{ cursor: "pointer", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                <span style={{ fontSize: 12, color: C.violet }}>{(previa[c.id] || []).length} en el tablón →</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>Toca para ver y montar la previa</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatView({ me, peer, clubName, messages, onBack, onSend }) {
  const [txt, setTxt] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = () => {
    if (txt.trim()) { onSend(txt.trim()); setTxt(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 5 }}>
        <button onClick={onBack} style={iconBtn} aria-label="Volver"><ChevronLeft size={20} color={C.text} /></button>
        <Avatar id={peer.id} name={peer.name} size={36} ring={C.bg} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{peer.name}</div>
          {clubName && <div style={{ fontSize: 12, color: C.muted }}>Vais a {clubName}</div>}
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {messages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", color: C.muted, fontSize: 13.5, maxWidth: 240 }}>
            <ShieldCheck size={22} color={C.teal} style={{ marginBottom: 8 }} />
            <div>Empieza la conversación para cuadrar la previa. Quedad siempre en sitio público.</div>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.from === me.id;
            return (
              <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                <div style={{
                  padding: "9px 13px", borderRadius: 16, fontSize: 14, lineHeight: 1.4,
                  background: mine ? grad : C.card, color: mine ? "#fff" : C.text,
                  border: mine ? "none" : `1px solid ${C.border}`,
                  borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4,
                }}>{m.text}</div>
                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3, textAlign: mine ? "right" : "left" }}>{timeAgo(m.ts)}</div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 16px 16px", borderTop: `1px solid ${C.border}`, background: C.bg, position: "sticky", bottom: 0 }}>
        <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe un mensaje…" style={{ ...inputStyle, marginBottom: 0 }} />
        <button onClick={send} style={{ ...iconBtn, background: grad, width: 44, border: "none" }} aria-label="Enviar"><Send size={17} color="#fff" /></button>
      </div>
    </div>
  );
}
