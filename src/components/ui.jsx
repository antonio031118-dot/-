import React from "react";
import { Flame, Map, Users, MessageCircle, User } from "lucide-react";
import { C } from "../theme.js";
import { colorFor, initials } from "../lib/util.js";

export function Shell({ children }) {
  return (
    <div style={{ background: C.bg, minHeight: "100dvh", color: C.text }}>
      <div style={{ maxWidth: 420, margin: "0 auto", position: "relative", minHeight: "100dvh", paddingBottom: 76 }}>
        {children}
      </div>
    </div>
  );
}

export function Avatar({ id, name, size = 26, ring = C.card }) {
  return (
    <div
      title={name}
      style={{
        width: size, height: size, borderRadius: size / 2, background: colorFor(id),
        border: `2px solid ${ring}`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 700, color: "#0B0A12", flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ going }) {
  const recent = going.slice(-3);
  const extra = going.length - recent.length;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {recent.map((p, i) => (
        <div key={p.id} style={{ marginLeft: i ? -9 : 0 }}>
          <Avatar id={p.id} name={p.name} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{ width: 26, height: 26, borderRadius: 13, background: C.raised, border: `2px solid ${C.card}`, marginLeft: -9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.sub }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.muted, fontWeight: 600, margin: "0 0 10px" }}>
      {children}
    </div>
  );
}

export function Placeholder({ icon, title, text, inline }) {
  return (
    <div style={{ padding: inline ? "30px 8px" : "80px 28px", textAlign: "center" }}>
      <div style={{ display: "inline-flex", padding: 16, borderRadius: 18, background: C.card, border: `1px solid ${C.border}`, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{title}</h3>
      <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{text}</p>
    </div>
  );
}

export function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 30 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: C.raised, borderRadius: "20px 20px 0 0", padding: 24, textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

export function BottomNav({ tab, setTab, unread = 0 }) {
  const items = [
    { id: "feed", icon: Flame, label: "Fiesta" },
    { id: "map", icon: Map, label: "Mapa" },
    { id: "friends", icon: Users, label: "Amigos" },
    { id: "messages", icon: MessageCircle, label: "Previas", badge: unread },
    { id: "profile", icon: User, label: "Tú" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 420, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "10px 0 14px", background: "rgba(11,10,18,0.92)", backdropFilter: "blur(10px)", borderTop: `1px solid ${C.border}`, zIndex: 10 }}>
      {items.map((it) => {
        const on = tab === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "2px 10px" }}>
            <Icon size={22} color={on ? C.magenta : C.muted} />
            <span style={{ fontSize: 10, color: on ? C.text : C.muted, fontWeight: on ? 600 : 500 }}>{it.label}</span>
            {it.badge > 0 && (
              <span style={{ position: "absolute", top: -2, right: 6, minWidth: 16, height: 16, padding: "0 4px", boxSizing: "border-box", borderRadius: 8, background: C.magenta, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {it.badge > 9 ? "9+" : it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
