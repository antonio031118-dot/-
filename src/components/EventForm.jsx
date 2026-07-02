import React, { useState } from "react";
import { PartyPopper, Trash2, Search } from "lucide-react";
import { C, grad, inputStyle, labelStyle, primaryBtn } from "../theme.js";
import { Modal } from "./ui.jsx";
import { typeColor } from "../lib/venues.js";

// Formulario para publicar/editar la fiesta de esta noche en un local.
export default function EventForm({ venues, initialVenueId, initialEvent, onClose, onSave, onDelete }) {
  const [venueId, setVenueId] = useState(initialVenueId || "");
  const [pick, setPick] = useState("");
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [time, setTime] = useState(initialEvent?.time || "");
  const [ticket, setTicket] = useState(initialEvent?.ticket || "");
  const [flyer, setFlyer] = useState(initialEvent?.flyer || "");

  const venue = venues.find((v) => v.id === venueId);
  const editing = !!initialEvent;

  const matches = pick.trim()
    ? venues.filter((v) => v.name.toLowerCase().includes(pick.trim().toLowerCase())).slice(0, 6)
    : [];

  const save = () => {
    if (!venueId || !title.trim()) return;
    onSave(venueId, { title: title.trim(), time, ticket: ticket.trim(), flyer: flyer.trim() }, venue?.name || "");
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <PartyPopper size={22} color={C.magenta} />
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{editing ? "Editar fiesta" : "Publicar fiesta de hoy"}</h3>
        </div>

        {/* Local */}
        {venue && initialVenueId ? (
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Discoteca</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{venue.name}</div>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Discoteca / local</div>
            {venue ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px" }}>
                <span style={{ fontWeight: 700 }}>{venue.name}</span>
                <button onClick={() => { setVenueId(""); setPick(""); }} style={{ background: "none", border: "none", color: C.violet, cursor: "pointer", fontSize: 13 }}>cambiar</button>
              </div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <Search size={16} color={C.muted} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input value={pick} onChange={(e) => setPick(e.target.value)} placeholder="Busca el local…" style={{ ...inputStyle, paddingLeft: 36, marginBottom: 0 }} />
                </div>
                {matches.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    {matches.map((v) => (
                      <button key={v.id} onClick={() => { setVenueId(v.id); setPick(""); }} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 11px", cursor: "pointer", color: C.text }}>
                        <span style={{ fontWeight: 600 }}>{v.name}</span>
                        <span style={{ color: typeColor(v.typeKey), fontSize: 12, marginLeft: 6 }}>{v.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Nombre de la fiesta</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Reggaeton Night · DJ Nano" style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Hora</div>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Enlace de entradas (opcional)</div>
          <input value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="https://…" style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={labelStyle}>Flyer / cartel — URL de imagen (opcional)</div>
          <input value={flyer} onChange={(e) => setFlyer(e.target.value)} placeholder="https://…/flyer.jpg" style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        <button onClick={save} disabled={!venueId || !title.trim()} style={{ ...primaryBtn, width: "100%", opacity: venueId && title.trim() ? 1 : 0.45 }}>
          {editing ? "Guardar cambios" : "Publicar fiesta"}
        </button>
        {editing && (
          <button onClick={() => onDelete(venueId)} style={{ width: "100%", marginTop: 8, padding: 11, borderRadius: 12, border: "none", background: "transparent", color: C.magenta, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Trash2 size={15} /> Borrar fiesta
          </button>
        )}
      </div>
    </Modal>
  );
}
