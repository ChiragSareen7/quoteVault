
import { createBrowserClient } from '@supabase/ssr';

export function createClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client components
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getClientSupabase() {
  if (!clientInstance) {
    clientInstance = createClientSupabase();
  }
  return clientInstance;
}

