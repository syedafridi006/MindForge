
import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Keep the Supabase client generic at the database boundary.
// This avoids Supabase inferring the ungenerated table schema as `never`.
type SupabaseClient = ReturnType<typeof createClient<any>>;

let client: SupabaseClient | null = null;

export function getDatabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured on the server.'
    );
  }

  if (!client) {
    client = createClient<any>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
