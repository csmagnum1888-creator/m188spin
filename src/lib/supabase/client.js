import { createClient } from "@supabase/supabase-js";

export function createBrowserSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return createClient(url, key);
}
