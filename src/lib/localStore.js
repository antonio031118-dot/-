// Almacenamiento local con sincronización entre pestañas del mismo navegador.
// Es el modo por defecto: arranca sin configurar nada. No sincroniza entre
// dispositivos distintos; para eso está el adaptador de Supabase.
const PREFIX = "salgo:";

export function createLocal() {
  const listeners = new Set();
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("salgo") : null;

  function emit(key) {
    listeners.forEach((cb) => {
      try { cb(key); } catch { /* noop */ }
    });
  }

  if (typeof window !== "undefined") {
    // Cambios hechos en OTRAS pestañas del mismo navegador.
    window.addEventListener("storage", (e) => {
      if (e.key && e.key.startsWith(PREFIX)) emit(e.key.slice(PREFIX.length));
    });
    if (channel) channel.onmessage = (e) => emit(e.data);
  }

  return {
    shared: false,
    async get(key) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v ? JSON.parse(v) : null;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch { /* cuota / modo privado */ }
      emit(key);            // misma pestaña
      channel?.postMessage(key); // otras pestañas
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
