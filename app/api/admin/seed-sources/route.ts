import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { upsertSources } from "@/lib/sources/upsert-sources";
import { sourceSeeds } from "@/lib/sources/sources.seed";

/**
 * Synct lib/sources/sources.seed.ts naar de `sources`-tabel. Bedoeld om
 * handmatig (of via een GitHub Actions workflow_dispatch) getriggerd te
 * worden na een wijziging in de seed-lijst — geen onderdeel van de
 * automatische aggregatiepipeline.
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { error } = await upsertSources(supabase);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, seeded: sourceSeeds.length });
}
