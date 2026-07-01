import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client die RLS omzeilt. Alleen gebruiken in pipeline-jobs
 * (cron workers) en admin-routes — nooit blootstellen aan de browser.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
