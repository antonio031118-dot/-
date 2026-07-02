// Selección automática de backend:
//   - Con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY  -> sincroniza entre móviles.
//   - Sin ellas                                       -> almacenamiento local.
// El resto de la app usa siempre la misma interfaz: get / set / subscribe.
import { createLocal } from "./localStore.js";
import { createSupabase } from "./supabaseStore.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const store = url && anon ? createSupabase(url, anon) : createLocal();
export const isShared = store.shared;
