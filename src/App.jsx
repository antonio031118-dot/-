import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, MapPin, Map, Share2, Check, Copy } from "lucide-react";
import { C, grad, primaryBtn } from "./theme.js";
import { CITIES, CLUBS, cityName } from "./data.js";
import { store, isShared } from "./lib/store.js";
import { partyDay, genCode, newId, convoId } from "./lib/util.js";
import { Shell, BottomNav, Modal, Placeholder } from "./components/ui.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { Header, ChipRow, ClubCard } from "./components/Feed.jsx";
import ClubDetail from "./components/ClubDetail.jsx";
import Friends from "./components/Friends.jsx";
import Profile from "./components/Profile.jsx";
import { MessagesTab, ChatView } from "./components/Chat.jsx";

// Identidad y ajustes propios del dispositivo (NO se comparten con el backend).
const DEVICE = "salgo:device:";
function loadDevice(k) {
  try { const v = localStorage.getItem(DEVICE + k); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function saveDevice(k, v) {
  try { localStorage.setItem(DEVICE + k, JSON.stringify(v)); } catch { /* noop */ }
}

const clubNameById = (id) => {
  for (const list of Object.values(CLUBS)) {
    const c = list.find((x) => x.id === id);
    if (c) return c.name;
  }
  return "";
};

export default function App() {
  const [profile, setProfile] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("feed");
  const [genre, setGenre] = useState("Todas");
  const [openClub, setOpenClub] = useState(null);

  const [attendance, setAttendance] = useState({});
  const [previa, setPrevia] = useState({});
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

  // ---- refresco de datos compartidos ----
  const refresh = useCallback(async () => {
    if (!profile || !city) return;
    const day = partyDay();
    const clubsList = CLUBS[city] || [];
    const dir = (await store.get("directory")) || {};

    const att = {}, prv = {};
    for (const club of clubsList) {
      att[club.id] = ((await store.get(`att:${day}:${club.id}`)) || []).filter(Boolean);
      prv[club.id] = ((await store.get(`prv:${day}:${club.id}`)) || []).filter(Boolean);
    }

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

    setAttendance(att);
    setPrevia(prv);
    setDirectory(dir);
    setFriends(fr);
    setConvos(convosList);

    if (chatPeer) {
      setChatMsgs((await store.get(`dm:${convoId(profile.id, chatPeer.id)}`)) || []);
    }
  }, [profile, city, chatPeer]);

  // Mantener viva la referencia para el subscribe sin recrear la suscripción.
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
    setGenre("Todas");
    setTab("feed");
  }

  async function toggleVoy(clubId) {
    if (!profile) return;
    const key = `att:${partyDay()}:${clubId}`;
    const list = ((await store.get(key)) || []).filter(Boolean);
    const here = list.some((x) => x.id === profile.id);
    const next = here
      ? list.filter((x) => x.id !== profile.id)
      : [...list, { id: profile.id, name: profile.name, ts: Date.now() }];
    setAttendance((a) => ({ ...a, [clubId]: next }));
    await store.set(key, next);
  }

  async function postPrevia(clubId, text) {
    if (!profile || !text.trim()) return;
    const key = `prv:${partyDay()}:${clubId}`;
    const list = ((await store.get(key)) || []).filter(Boolean);
    const next = [...list, { id: profile.id, name: profile.name, text: text.trim(), ts: Date.now() }];
    setPrevia((p) => ({ ...p, [clubId]: next }));
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
    const day = partyDay();
    for (const c of CLUBS[city] || []) {
      const key = `att:${day}:${c.id}`;
      const list = ((await store.get(key)) || []).filter((x) => x.id !== profile.id);
      await store.set(key, list);
    }
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
  const clubs = CLUBS[city] || [];
  const friendIds = new Set(friends.map((f) => f.id));
  const goingTo = clubs.filter((c) => (attendance[c.id] || []).some((x) => x.id === profile?.id));
  const unread = convos.reduce((n, c) => n + (c.unread ? 1 : 0), 0);
  const friendPlans = {};
  for (const f of friends) {
    friendPlans[f.id] = clubs.filter((c) => (attendance[c.id] || []).some((x) => x.id === f.id)).map((c) => c.name);
  }

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
        <ChatView me={profile} peer={chatPeer} clubName={chatClubId ? clubNameById(chatClubId) : ""}
          messages={chatMsgs} onBack={() => { setChatPeer(null); refresh(); }} onSend={sendMsg} />
      </Shell>
    );
  }

  if (openClub) {
    const club = clubs.find((c) => c.id === openClub);
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
          <ChipRow genre={genre} setGenre={setGenre} />
          <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {clubs.filter((c) => genre === "Todas" || c.genres.includes(genre)).map((club) => (
              <ClubCard key={club.id} club={club} going={attendance[club.id] || []} me={profile} friendIds={friendIds}
                onOpen={() => setOpenClub(club.id)} onVoy={() => toggleVoy(club.id)} />
            ))}
          </div>
        </>
      )}

      {tab === "map" && (
        <Placeholder icon={<Map size={26} color={C.violet} />} title="Mapa de la noche"
          text={`Aquí irá el mapa de ${cityName(city)} con las discotecas y dónde se concentra la gente. De momento, todo pasa en el feed.`} />
      )}

      {tab === "friends" && (
        <Friends myCode={profile.code} friends={friends} friendPlans={friendPlans}
          onAdd={addFriendByCode} onChat={(f) => openChat(f, null)} />
      )}

      {tab === "messages" && (
        <MessagesTab convos={convos} goingTo={goingTo} previa={previa} me={profile}
          onOpenChat={(c) => openChat({ id: c.withId, name: c.withName }, c.clubId)} onOpenClub={(id) => setOpenClub(id)} />
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
