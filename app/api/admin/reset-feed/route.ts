import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const maxDuration = 120;

/**
 * Gooit de nieuwsfeed volledig leeg voor een gecontroleerde heropbouw:
 * alle topics (incl. tijdlijnen), raw_items (incl. vertalingen, via cascade)
 * en pipeline-jobs verdwijnen. Bronnen en hun enabled-vlaggen blijven staan,
 * maar hun fetch-status wordt gereset zodat de eerstvolgende tick alles vers
 * ophaalt. FM-data (spelers, stemmen, opstellingen) wordt niet geraakt.
 *
 * Destructief — vereist naast ADMIN_SECRET ook ?confirm=LEEG:
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     "https://ossenworst.vercel.app/api/admin/reset-feed?confirm=LEEG"
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (new URL(request.url).searchParams.get("confirm") !== "LEEG") {
    return NextResponse.json(
      { error: "bevestiging vereist: voeg ?confirm=LEEG toe om de hele feed te wissen" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServiceClient();

    // Jobs eerst: een overlappende tick mag niet doorwerken op rijen die
    // hieronder verdwijnen.
    const { count: jobs, error: jobsError } = await supabase
      .from("jobs")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (jobsError) throw jobsError;

    // Topics verwijderen (cascade ruimt topic_items en comments op).
    const { count: topics, error: topicsError } = await supabase
      .from("topics")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (topicsError) throw topicsError;

    // Raw items verwijderen (cascade ruimt translations op).
    const { count: rawItems, error: rawError } = await supabase
      .from("raw_items")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (rawError) throw rawError;

    // Fetch-status resetten zodat de eerstvolgende tick alle actieve bronnen
    // direct vers ophaalt.
    const { error: sourcesError } = await supabase
      .from("sources")
      .update({ last_fetched_at: null, last_status: null })
      .not("id", "is", null);
    if (sourcesError) throw sourcesError;

    return NextResponse.json({ ok: true, deleted: { topics, rawItems, jobs } });
  } catch (err) {
    console.error("reset-feed faalde:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
