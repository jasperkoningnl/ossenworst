import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { upsertSources } from "@/lib/sources/upsert-sources";
import { sourceSeeds } from "@/lib/sources/sources.seed";
import { upsertPlayers } from "@/lib/players/upsert-players";
import { playerSeeds } from "@/lib/players/squad.seed";

/**
 * Synct lib/sources/sources.seed.ts naar de `sources`-tabel en
 * lib/players/squad.seed.ts naar de `players`-tabel. Bedoeld om handmatig
 * (of via de "Seed sources" GitHub Actions workflow) getriggerd te worden
 * na een wijziging in de seed-lijsten — geen onderdeel van de automatische
 * aggregatiepipeline.
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const overwriteEnabled =
    new URL(request.url).searchParams.get("overwriteEnabled") === "1";

  const supabase = createServiceClient();
  const { error } = await upsertSources(supabase, { overwriteEnabled });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: playersError } = await upsertPlayers(supabase);
  if (playersError) {
    return NextResponse.json(
      { error: `players: ${playersError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    seededSources: sourceSeeds.length,
    seededPlayers: playerSeeds.length,
    overwriteEnabled,
  });
}
