import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";

/* ============================================
   GET — List all releases
============================================ */
export async function GET() {
  try {
    const result = await query(
      "SELECT * FROM releases ORDER BY release_date DESC"
    );

    return NextResponse.json({ ok: true, releases: result.rows });
  } catch (err: any) {
    console.error("Error loading releases:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/* ============================================
   POST — Create new release
============================================ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const title = (body.title || "").trim();
    const artistId = (body.artistId || "").trim();
    const releaseDate = body.releaseDate || null;

    if (!title || !artistId) {
      return NextResponse.json(
        { ok: false, error: "Title and artistId are required." },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO releases (
        artist_id,
        title,
        release_date,
        status,
        artist_split,
        label_split,
        cover_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, NULL)
      RETURNING *;
    `;

    const result = await query(sql, [
      artistId,
      title,
      releaseDate,
      "Draft",
      "0.8",
      "0.2"
    ]);

    return NextResponse.json({ ok: true, release: result.rows[0] });
  } catch (err: any) {
    console.error("Error creating release:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/* ============================================
   PATCH — Update release details + cover art
============================================ */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const releaseId = (body.releaseId || "").trim();
    const title = (body.title || "").trim();
    const status = (body.status || "").trim() || "Draft";
    const releaseDate = body.releaseDate || null;

    // NEW: cover art URL (from upload route)
    const coverUrl = body.coverUrl || null;

    if (!releaseId || !title) {
      return NextResponse.json(
        { ok: false, error: "releaseId and title are required." },
        { status: 400 }
      );
    }

    const sql = `
      UPDATE releases
      SET
        title = $1,
        status = $2,
        release_date = $3,
        cover_url = $4
      WHERE release_id = $5
      RETURNING *;
    `;

    const result = await query(sql, [
      title,
      status,
      releaseDate,
      coverUrl,
      releaseId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Release not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, release: result.rows[0] });
  } catch (err: any) {
    console.error("Error updating release:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
