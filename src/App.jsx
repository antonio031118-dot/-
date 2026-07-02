import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { Sparkles, X, MapPin, Share2, Copy, ChevronDown, Loader2 } from "lucide-react";
import { C, grad, primaryBtn } from "./theme.js";
import { CITIES, cityName } from "./data.js";
import { store, isShared } from "./lib/store.js";
import { partyDay, genCode, newId, convoId } from "./lib/util.js";
import { SEED, fetchVenues, mergeVenues, matchFilter } from "./lib/venues.js";
import { Shell, BottomNav, Modal, Placeholder } from "./components/ui.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { Header, Filters, SearchBar, ClubCard } from "./components/Feed.jsx";
import ClubDetail from "./components/ClubDetail.jsx";
import Friends from "./components/Friends.jsx";
import Profile from "./components/Profile.jsx";
import { MessagesTab, ChatView } from "./components/Chat.jsx";

// El mapa (MapLibre) se carga solo al abrir la pestaña Mapa, para no pesar al arrancar.
const CityMap = lazy(() => import("./components/CityMap.jsx"));

// Identidad y ajustes propios del dispositivo (NO se comparten con el backend).
const DEVICE = "salgo:device:";
function loadDevice(k) {
  try { const v = localStorage.getItem(DEVICE + k); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function saveDevice(k, v) {
  try { localStorage.setItem(DEVICE + k, JSON.stringify(v)); } catch { /* noop */ }
}

const VENUES_TTL = 30 * 24 * 60 * 60 * 1000; // 30 días

export default function App() {
  const [profile, setProfile] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("feed");
  const [filter, setFilter] = useState("disco");
  const [search, setSearch] = useState("");
  const [openClub, setOpenClub] = useState(null);

  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  const [attendance, setAttendance] = useState({}); // { venueId: [ {id,name,ts} ] }
  const [previa, setPrevia] = useState({});         // { venueId: [ {id,name,text,ts} ] }
  const [directory, setDirectory] = useState({});
  const [friends, setFriends] = useState([]);
  const [convos, setConvos] = useState([]);

  const [chatPeer, setChatPeer] = useState(null);
  const [chatClubId, setChatClubId] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);

  const [showShare, setShowShare] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [banner, setBanner] = useState(true);

  // ---- carga inicial de identidad ----
  useEffect(() => {
    const p = loadDevice("profile");
    const ci = loadDevice("city");
    if (p) setProfile(p);
    if (ci) setCity(ci);
    setLoading(false);
  }, []);

  // ---- carga de locales de la ciudad (respaldo instantáneo + OSM en vivo) ----
  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    setVenues(SEED[city] || []);
    (async () => {
      setVenuesLoading(true);
      try {
        const cached = await store.get(`venues:${city}`);
        if (cached?.list?.length && Date.now() - (cached.ts || 0) < VENUES_TTL) {
          if (!cancelled) setVenues(cached.list);
        } else {
          const live = await fetchVenues(city);
          const merged = mergeVenues(SEED[city] || [], live || []);
          if (!cancelled) setVenues(merged);
          if (live?.length) await store.set(`venues:${city}`, { ts: Date.now(), list: merged });
        }
      } catch { /* nos quedamos con el respaldo */ }
      if (!cancelled) setVenuesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [city]);

  const venueById = useCallback((id) => venues.find((v) => v.id === id) || null, [venues]);

  // ---- refresco de datos compartidos ----
  const refresh = useCallback(async () => {
    if (!profile || !city) return;
    const day = partyDay();
    const att = (await store.get(`att:${day}:${city}`)) || {};

    const dir = (await store.get("directory")) || {};
    const friendIds = (await store.get(`friends:${profile.id}`)) || [];
    const fr = friendIds.map((id) => (dir[id] ? { id, name: dir[id].name } : null)).filter(Boolean);

    const seen = loadDevice("seen") || {};
    const rawConvos = (await store.get(`convos:${profile.id}`)) || [];
    const convosList = rawConvos
      .slice()
      .sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0))
      .map((c) => ({
        ...c,
        unread: c.lastFrom !== profile.id && (c.lastTs || 0) > (seen[convoId(profile.id, c.withId)] || 0) ? 1 : 0,
      }));

    // Previa: solo de los sitios donde voy (+ el que tengo abierto).
    const goingIds = Object.keys(att).filter((id) => (att[id] || []).some((x) => x.id === profile.id));
    const wanted = new Set([...goingIds, ...(openClub ? [openClub] : [])]);
    const prv = {};
    for (const id of wanted) prv[id] = (await store.get(`prv:${id}`)) || [];

    setAttendance(att);
    setDirectory(dir);
    setFriends(fr);
    setConvos(convosList);
    setPrevia((p) => ({ ...p, ...prv }));

    if (chatPeer) {
      setChatMsgs((await store.get(`dm:${convoId(profile.id, chatPeer.id)}`)) || []);
    }
  }, [profile, city, openClub, chatPeer]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (loading || !profile || !city) return;
    let t;
    const run = () => { clearTimeout(t); t = setTimeout(() => refreshRef.current(), 120); };
    const unsub = store.subscribe(run);
    refreshRef.current();
    const iv = setInterval(() => refreshRef.current(), 15000);
    return () => { unsub(); clearInterval(iv); clearTimeout(t); };
  }, [loading, profile, city]);

  // ---- acciones ----
  async function startSession(name, cityId) {
    const p = { id: newId(), name, code: genCode() };
    saveDevice("profile", p);
    saveDevice("city", cityId);
    const dir = (await store.get("directory")) || {};
    dir[p.id] = { id: p.id, name: p.name, code: p.code };
    await store.set("directory", dir);
    setProfile(p);
    setCity(cityId);
  }

  async function changeCity(id) {
    setCity(id);
    saveDevice("city", id);
    setShowCities(false);
    setOpenClub(null);
    setFilter("disco");
    setSearch("");
    setTab("feed");
  }

  async function toggleVoy(venueId) {
    if (!profile) return;
    const key = `att:${partyDay()}:${city}`;
    const doc = (await store.get(key)) || {};
    const list = (doc[venueId] || []).filter(Boolean);
    const here = list.some((x) => x.id === profile.id);
    const next = here
      ? list.filter((x) => x.id !== profile.id)
      : [...list, { id: profile.id, name: profile.name, ts: Date.now() }];
    if (next.length) doc[venueId] = next; else delete doc[venueId];
    setAttendance({ ...doc });
    await store.set(key, doc);
  }

  async function openVenue(id) {
    setOpenClub(id);
    const list = (await store.get(`prv:${id}`)) || [];
    setPrevia((p) => ({ ...p, [id]: list }));
  }

  async function postPrevia(venueId, text) {
    if (!profile || !text.trim()) return;
    const key = `prv:${venueId}`;
    const list = ((await store.get(key)) || []).filter(Boolean);
    const next = [...list, { id: profile.id, name: profile.name, text: text.trim(), ts: Date.now() }];
    setPrevia((p) => ({ ...p, [venueId]: next }));
    await store.set(key, next);
  }

  async function addEdge(a, b) {
    const key = `friends:${a}`;
    const list = (await store.get(key)) || [];
    if (!list.includes(b)) await store.set(key, [...list, b]);
  }

  async function addFriendByCode(code) {
    const dir = (await store.get("directory")) || {};
    const found = Object.values(dir).find((u) => u.code === code && u.id !== profile.id);
    if (!found) return { ok: false, text: "No encontramos ese código." };
    const mine = (await store.get(`friends:${profile.id}`)) || [];
    if (mine.includes(found.id)) return { ok: false, text: `Ya tienes a ${found.name}.` };
    await addEdge(profile.id, found.id);
    await addEdge(found.id, profile.id);
    await refresh();
    return { ok: true, text: `¡${found.name} añadido!` };
  }

  async function addFriendObj(p) {
    if (!p || p.id === profile.id) return;
    await addEdge(profile.id, p.id);
    await addEdge(p.id, profile.id);
    await refresh();
  }

  const openChat = useCallback(async (peer, clubId = null) => {
    setChatPeer({ id: peer.id, name: peer.name });
    setChatClubId(clubId);
    setOpenClub(null);
    const seen = loadDevice("seen") || {};
    seen[convoId(profile.id, peer.id)] = Date.now();
    saveDevice("seen", seen);
    setChatMsgs((await store.get(`dm:${convoId(profile.id, peer.id)}`)) || []);
    refresh();
  }, [profile, refresh]);

  async function upsertConvo(ownerId, entry) {
    const key = `convos:${ownerId}`;
    const list = ((await store.get(key)) || []).filter((c) => c.withId !== entry.withId);
    await store.set(key, [entry, ...list]);
  }

  async function sendMsg(text) {
    if (!profile || !chatPeer) return;
    const cid = convoId(profile.id, chatPeer.id);
    const list = (await store.get(`dm:${cid}`)) || [];
    const msg = { from: profile.id, fromName: profile.name, text, ts: Date.now() };
    const next = [...list, msg];
    setChatMsgs(next);
    await store.set(`dm:${cid}`, next);
    const base = { lastText: text, lastFrom: profile.id, lastTs: msg.ts, clubId: chatClubId };
    await upsertConvo(profile.id, { withId: chatPeer.id, withName: chatPeer.name, ...base });
    await upsertConvo(chatPeer.id, { withId: profile.id, withName: profile.name, ...base });
    const seen = loadDevice("seen") || {};
    seen[cid] = Date.now();
    saveDevice("seen", seen);
  }

  async function resetMyNight() {
    const key = `att:${partyDay()}:${city}`;
    const doc = (await store.get(key)) || {};
    for (const id of Object.keys(doc)) {
      const filtered = (doc[id] || []).filter((x) => x.id !== profile.id);
      if (filtered.length) doc[id] = filtered; else delete doc[id];
    }
    await store.set(key, doc);
    await refresh();
  }

  function shareLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: "Salgo", text: `Esta noche en ${cityName(city)}. Mira a dónde sale la gente:`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  // ---- derivados ----
  const friendIds = new Set(friends.map((f) => f.id));
  const goingTo = venues.filter((v) => (attendance[v.id] || []).some((x) => x.id === profile?.id));
  const unread = convos.reduce((n, c) => n + (c.unread ? 1 : 0), 0);
  const friendPlans = {};
  for (const f of friends) {
    friendPlans[f.id] = venues.filter((v) => (attendance[v.id] || []).some((x) => x.id === f.id)).map((v) => v.name);
  }

  const q = search.trim().toLowerCase();
  const filtered = venues
    .filter((v) => matchFilter(v, filter))
    .filter((v) => !q || v.name.toLowerCase().includes(q) || (v.area || "").toLowerCase().includes(q))
    .map((v) => ({ v, count: (attendance[v.id] || []).length }))
    .sort((a, b) => b.count - a.count || a.v.name.localeCompare(b.v.name, "es"))
    .map((x) => x.v);
  const shown = filtered.slice(0, 100);

  // ---------- pantallas ----------
  if (loading) {
    return <Shell><div style={{ padding: "120px 24px", textAlign: "center", color: C.muted }}>Encendiendo las luces…</div></Shell>;
  }

  if (!profile || !city) {
    return <Onboarding onStart={startSession} />;
  }

  if (chatPeer) {
    return (
      <Shell>
        <ChatView me={profile} peer={chatPeer} clubName={chatClubId ? venueById(chatClubId)?.name || "" : ""}
          messages={chatMsgs} onBack={() => { setChatPeer(null); refresh(); }} onSend={sendMsg} />
      </Shell>
    );
  }

  if (openClub) {
    const club = venueById(openClub);
    if (club) {
      return (
        <Shell>
          <ClubDetail club={club} going={attendance[club.id] || []} posts={previa[club.id] || []} me={profile}
            friendIds={friendIds} onBack={() => setOpenClub(null)} onVoy={() => toggleVoy(club.id)}
            onPost={(t) => postPrevia(club.id, t)} onChat={(p) => openChat(p, club.id)} onAddFriend={addFriendObj} />
          <BottomNav tab={tab} setTab={(t) => { setOpenClub(null); setTab(t); }} unread={unread} />
        </Shell>
      );
    }
  }

  return (
    <Shell>
      {tab === "feed" && (
        <>
          <Header me={profile} city={city} onCity={() => setShowCities(true)} onShare={() => setShowShare(true)} />
          {banner && (
            <div style={{ margin: "0 16px 8px", padding: "10px 12px", background: "rgba(139,92,246,0.12)", border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Sparkles size={16} color={C.violet} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.45 }}>
                Comparte el enlace con tu gente de {cityName(city)}. Cuando marquéis "Voy", los votos se suman aquí en vivo.
              </div>
              <X size={15} color={C.muted} style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setBanner(false)} />
            </div>
          )}
          <SearchBar value={search} onChange={setSearch} />
          <Filters filter={filter} setFilter={setFilter} />
          <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {shown.length === 0 && (
              <div style={{ color: C.muted, fontSize: 13.5, textAlign: "center", padding: "24px 0" }}>
                {venuesLoading ? "Cargando locales…" : "No hay sitios que coincidan. Prueba otro filtro o búsqueda."}
              </div>
            )}
            {shown.map((club) => (
              <ClubCard key={club.id} club={club} going={attendance[club.id] || []} me={profile} friendIds={friendIds}
                onOpen={() => openVenue(club.id)} onVoy={() => toggleVoy(club.id)} />
            ))}
            {filtered.length > shown.length && (
              <div style={{ color: C.muted, fontSize: 12.5, textAlign: "center", padding: "4px 0 8px" }}>
                +{filtered.length - shown.length} sitios más — usa el buscador o el mapa 🗺️
              </div>
            )}
          </div>
        </>
      )}

      {tab === "map" && (
        <div style={{ position: "fixed", top: 0, bottom: 72, left: 0, right: 0, maxWidth: 420, margin: "0 auto", background: C.bg }}>
          <Suspense fallback={<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>Cargando mapa…</div>}>
            <CityMap city={city} venues={filtered} attendance={attendance} me={profile} onOpen={openVenue} />
          </Suspense>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 16px 26px", background: "linear-gradient(180deg, rgba(11,10,18,0.9) 0%, rgba(11,10,18,0) 100%)", pointerEvents: "none" }}>
            <button onClick={() => setShowCities(true)} style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, color: C.sub }}>
              <MapPin size={13} /> <span style={{ fontSize: 13, fontWeight: 600 }}>{cityName(city)}</span> <ChevronDown size={13} />
            </button>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
              Toca un punto para ver quién va. Rosa = tú · violeta = hay gente.
            </div>
          </div>
          {venuesLoading && (
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, background: "rgba(22,19,31,0.95)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "7px 13px", fontSize: 12.5, color: C.sub }}>
              <Loader2 size={14} className="salgo-spin" /> Cargando locales de {cityName(city)}…
            </div>
          )}
        </div>
      )}

      {tab === "friends" && (
        <Friends myCode={profile.code} friends={friends} friendPlans={friendPlans}
          onAdd={addFriendByCode} onChat={(f) => openChat(f, null)} />
      )}

      {tab === "messages" && (
        <MessagesTab convos={convos} goingTo={goingTo} previa={previa} me={profile}
          onOpenChat={(c) => openChat({ id: c.withId, name: c.withName }, c.clubId)} onOpenClub={(id) => openVenue(id)} />
      )}

      {tab === "profile" && (
        <Profile me={profile} city={city} myCode={profile.code} goingTo={goingTo} friendCount={friends.length}
          onShare={() => setShowShare(true)} onCity={() => setShowCities(true)} onReset={resetMyNight} />
      )}

      <BottomNav tab={tab} setTab={setTab} unread={unread} />

      {showCities && (
        <Modal onClose={() => setShowCities(false)}>
          <MapPin size={26} color={C.magenta} />
          <h3 style={{ margin: "12px 0 14px", fontSize: 20, fontWeight: 700 }}>Elige ciudad</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CITIES.map((c) => (
              <button key={c.id} onClick={() => changeCity(c.id)} style={{
                width: "100%", padding: "13px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600,
                border: "none", background: c.id === city ? grad : C.card, color: c.id === city ? "#fff" : C.text,
                boxShadow: c.id === city ? "none" : `inset 0 0 0 1px ${C.border}`,
              }}>{c.name}</button>
            ))}
          </div>
        </Modal>
      )}

      {showShare && (
        <Modal onClose={() => setShowShare(false)}>
          <Share2 size={28} color={C.magenta} />
          <h3 style={{ margin: "14px 0 6px", fontSize: 20, fontWeight: 700, color: C.text }}>Probadlo esta noche</h3>
          <p style={{ color: C.sub, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
            Pásale el enlace a tu gente de {cityName(city)}. Cada uno marca a dónde va y veréis en directo si el ambiente se nota antes de salir.
          </p>
          <button onClick={shareLink} style={{ ...primaryBtn, width: "100%", marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Copy size={16} /> Compartir enlace
          </button>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, margin: "12px 0 0" }}>
            {isShared ? "Todo lo que marquéis es compartido y visible para quien tenga el enlace." : "Estás en modo local: para sincronizar entre móviles, activa Supabase (ver README)."}
          </p>
        </Modal>
      )}
    </Shell>
  );
}
