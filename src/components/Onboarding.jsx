import React, { useState } from "react";
import { Shell } from "./ui.jsx";
import { C, grad, inputStyle, labelStyle, primaryBtn } from "../theme.js";
import { CITIES } from "../data.js";
import { isShared } from "../lib/store.js";

export default function Onboarding({ onStart }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("madrid");

  const submit = () => {
    if (name.trim()) onStart(name.trim(), city);
  };

  return (
    <Shell>
      <div style={{ padding: "52px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: C.muted, textTransform: "uppercase" }}>Esta noche</div>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: "10px 0 4px", lineHeight: 1.02, background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Salgo</h1>
        <p style={{ color: C.sub, fontSize: 16, margin: "0 0 30px", lineHeight: 1.5 }}>
          Marca a dónde vas, mira dónde está la gente y monta la previa antes de decidir.
        </p>

        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <div style={labelStyle}>¿En qué ciudad sales?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {CITIES.map((c) => {
              const on = c.id === city;
              return (
                <button key={c.id} onClick={() => setCity(c.id)} style={{
                  flex: 1, fontSize: 13.5, padding: "11px 6px", borderRadius: 12, cursor: "pointer", fontWeight: 600,
                  border: on ? "none" : `1px solid ${C.border}`,
                  background: on ? grad : "transparent", color: on ? "#fff" : C.sub,
                }}>{c.name}</button>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: "left" }}>
          <div style={labelStyle}>¿Cómo te llamas?</div>
          <input value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Tu nombre" style={inputStyle} />
        </div>

        <button onClick={submit} disabled={!name.trim()} style={{ ...primaryBtn, width: "100%", marginTop: 14, opacity: name.trim() ? 1 : 0.45 }}>
          Entrar
        </button>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 18, lineHeight: 1.5 }}>
          {isShared
            ? "Lo que marques lo verá tu gente en directo. Es un prototipo de prueba."
            : "Prototipo en modo local: lo que marques se ve en este navegador. Activa la sincronización para probarlo en varios móviles."}
        </p>
      </div>
    </Shell>
  );
}
