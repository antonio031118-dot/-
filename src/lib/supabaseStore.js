// Adaptador de Supabase: sincroniza de verdad entre dispositivos distintos.
// Se activa solo si defines VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
// Necesita una tabla `kv` (ver el SQL del README) con Realtime activado.
import { createClient } from "@supabase/supabase-js";

export function createSupabase(url, anonKey) {
  const sb = createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 5 } } });
  const listeners = new Set();

  function emit(key) {
    listeners.forEach((cb) => {
      try { cb(key); } catch { /* noop */ }
    });
  }

  sb.channel("kv-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "kv" }, (payload) => {
      const key = payload.new?.key ?? payload.old?.key;
      if (key) emit(key);
    })
    .subscribe();

  return {
    shared: true,
    async get(key) {
      const { data, error } = await sb.from("kv").select("value").eq("key", key).maybeSingle();
      if (error) return null;
      return data ? data.value : null;
    },
    async set(key, value) {
      await sb.from("kv").upsert({ key, value, updated_at: new Date().toISOString() });
      emit(key); // eco local inmediato (no esperamos al realtime)
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
