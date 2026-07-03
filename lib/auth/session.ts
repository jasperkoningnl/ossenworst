import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Zorgt client-side voor een sessie (desnoods anoniem via Supabase anonymous
 * sign-in) en een bijbehorende `profiles`-rij, en geeft het user-id terug.
 *
 * Geeft null terug als anonymous sign-ins niet aanstaan in het
 * Supabase-project (Authentication → Sign In / Providers → Anonymous).
 */
export async function ensureProfile(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let userId = session?.user.id ?? null;
  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    userId = data.user?.id ?? null;
  }
  if (!userId) return null;

  // ignoreDuplicates: een bestaand profiel (met evt. username) niet overschrijven.
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
  return userId;
}
