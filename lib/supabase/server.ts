import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client voor Server Components, Route Handlers en
 * Server Actions. Respecteert RLS via de sessie-cookie van de aanroeper.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll wordt aangeroepen vanuit een Server Component zonder
            // schrijfrechten op cookies; middleware ververst de sessie dan.
          }
        },
      },
    }
  );
}
