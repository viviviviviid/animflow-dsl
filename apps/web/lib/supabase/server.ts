import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseConfig } from "@/lib/supabase/config";

export function createSupabaseServerClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;
  const cookieStore = cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          for (const { name, value, options } of values) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Route handlers can.
        }
      },
    },
  });
}
