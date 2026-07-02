import React, { useState } from "react";
import { Copy, Check, UserPlus, MessageCircle, MapPin } from "lucide-react";
import { C, grad, inputStyle, primaryBtn } from "../theme.js";
import { Avatar, SectionTitle, Placeholder } from "./ui.jsx";

export default function Friends({ myCode, friends, friendPlans, onAdd, onChat }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  };

  const submit = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const res = await onAdd(c);
    setMsg(res);
    if (res.ok) setCode("");
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div style={{ padding: "18px 16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Amigos</h2>
      <p style={{ color: C.sub, fontSize: 13.5, margin: "0 0 18px" }}>Añade a tu gente y mira a dónde sale esta noche.</p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 18 }}>
        <SectionTitle>Tu código</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{myCode}</div>
          <button onClick={copy} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, padding: "8px 12px", borderRadius: 10, cursor: "pointer", border: "none", background: "transparent", color: C.text, boxShadow: `inset 0 0 0 1px ${C.borderStrong}` }}>
            {copied ? <Check size={15} color={C.teal} /> : <Copy size={15} color={C.sub} />}{copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p style={{ color: C.muted, fontSize: 12, margin: "10px 0 0", lineHeight: 1.5 }}>Pásaselo a tus amigos para que te añadan.</p>
      </div>

      <SectionTitle>Añadir por código</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: msg ? 8 : 22 }}>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={5} placeholder="ABC23" style={{ ...inputStyle, marginBottom: 0, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }} />
        <button onClick={submit} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <UserPlus size={16} /> Añadir
        </button>
      </div>
      {msg && (
        <p style={{ color: msg.ok ? C.teal : C.magenta, fontSize: 13, margin: "0 0 18px" }}>{msg.text}</p>
      )}

      <SectionTitle>Tus amigos ({friends.length})</SectionTitle>
      {friends.length === 0 ? (
        <Placeholder inline icon={<UserPlus size={24} color={C.violet} />} title="Aún no tienes amigos aquí" text="Añade a tu gente con su código y los verás aparecer por las discotecas." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {friends.map((f) => {
            const plans = friendPlans[f.id] || [];
            return (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 11, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                <Avatar id={f.id} name={f.name} size={38} ring={C.card} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{f.name}</div>
                  <div style={{ fontSize: 12.5, color: plans.length ? C.teal : C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    {plans.length ? <><MapPin size={12} /> {plans.join(", ")}</> : "Aún no ha marcado sitio"}
                  </div>
                </div>
                <button onClick={() => onChat(f)} style={{ width: 38, height: 38, borderRadius: 11, border: "none", background: grad, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-label="Escribir">
                  <MessageCircle size={16} color="#fff" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
