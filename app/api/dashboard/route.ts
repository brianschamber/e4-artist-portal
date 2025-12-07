import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { sql } from "../../../lib/db";

type AnyRow = Record<string, any>;

// Helper to safely run a SUM/COUNT query and return 0 on error
async function safeNumberQuery(
  query: TemplateStringsArray,
  ...values: any[]
): Promise<number> {
  try {
    const rows = (await (sql as any)(query, ...values)) as AnyRow[];
    if (!rows || rows.length === 0) return 0;

    const firstRow = rows[0];
    const firstKey = Object.keys(firstRow)[0];
    const raw = firstRow[firstKey];

    const num = Number(raw ?? 0);
    return Number.isNaN(num) ? 0 : num;
  } catch (err) {
    console.error("safeNumberQuery error:", err);
    return 0;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to read artist_id, but don't fail if it's missing
    const artistId = (session.user as any)?.artist_id ?? null;

    // 1) Releases count
    const releasesCount = artistId
      ? await safeNumberQuery`
          SELECT COUNT(*)::text AS count
          FROM public.releases
          WHERE artist_id = ${artistId};
        `
      : await safeNumberQuery`
          SELECT COUNT(*)::text AS count
          FROM public.releases;
        `;

    // 2) Tracks count
    const tracksCount = artistId
      ? await safeNumberQuery`
          SELECT COUNT(*)::text AS count
          FROM public.tracks t
          JOIN public.releases r ON t.release_id = r.release_id
          WHERE r.artist_id = ${artistId};
        `
      : await safeNumberQuery`
          SELECT COUNT(*)::text AS count
          FROM public.tracks;
        `;

    // 3) Pending payouts (if table exists)
    const pendingPayouts = artistId
      ? await safeNumberQuery`
          SELECT COALESCE(SUM(amount), 0)::text AS total
          FROM public.payouts
          WHERE artist_id = ${artistId}
            AND status = 'pending';
        `
      : await safeNumberQuery`
          SELECT COALESCE(SUM(amount), 0)::text AS total
          FROM public.payouts
          WHERE status = 'pending';
        `;

    // 4) Lifetime earnings (if table exists)
    const totalEarnings = artistId
      ? await safeNumberQuery`
          SELECT COALESCE(SUM(amount), 0)::text AS total
          FROM public.earnings
          WHERE artist_id = ${artistId};
        `
      : await safeNumberQuery`
          SELECT COALESCE(SUM(amount), 0)::text AS total
          FROM public.earnings;
        `;

    return NextResponse.json({
      releasesCount,
      tracksCount,
      pendingPayouts,
      totalEarnings,
    });
  } catch (err) {
    console.error("Error in /api/dashboard:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
