
import 'server-only';
import { createClient } from '@supabase/supabase-js';

type Database = {
  public: {
    Tables: {
      mindforge_vault: {
        Row: {
          id: number;
          data: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          data?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          id?: number;
          data?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getDatabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.'
    );
  }

  if (!client) {
    client = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
