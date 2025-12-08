import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/* GET /api/tracks?releaseId=... */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const releaseId = searchParams.get("releaseId");
    const trackId = searchParams.get("trackId");

    if (!releaseId && !trackId) {
      return error("releaseId or trackId is required", 400);
    }

    if (trackId) {
      const rows = await sql`
        SELECT track_id, release_id, track_number, title, audio_url
        FROM tracks
        WHERE track_id = ${trackId}
      `;
      if (rows.length === 0) return error("Track not found", 404);
      return NextResponse.json({ ok: true, track: rows[0] });
    }

    const rows = await sql`
      SELECT track_id, release_id, track_number, title, audio_url
      FROM tracks
      WHERE release_id = ${releaseId}
      ORDER BY track_number NULLS LAST, created_at ASC
    `;

    return NextResponse.json({ ok: true, tracks: rows });
  } catch (err) {
    console.error("GET /api/tracks error:", err);
    return error("Failed to load tracks", 500);
  }
}

/* POST /api/tracks */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { releaseId, title, trackNumber, audioUrl } = body;

    if (!releaseId) return error("releaseId is required");
    if (!title || !title.trim()) return error("Track title is required");

    const rows = await sql`
      INSERT INTO tracks (release_id, title, track_number, audio_url)
      VALUES (${releaseId}, ${title.trim()}, ${trackNumber}, ${audioUrl})
      RETURNING track_id, release_id, track_number, title, audio_url
    `;

    return NextResponse.json({ ok: true, track: rows[0] });
  } catch (err) {
    console.error("POST /api/tracks error:", err);
    return error("Failed to create track", 500);
  }
}

/* PATCH /api/tracks */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { trackId, title, trackNumber, audioUrl } = body;

    if (!trackId) return error("trackId is required");
    if (!title || !title.trim()) return error("Track title is required");

    const rows = await sql`
      UPDATE tracks
      SET
        title = ${title.trim()},
        track_number = ${trackNumber},
        audio_url = ${audioUrl}
      WHERE track_id = ${trackId}
      RETURNING track_id, release_id, track_number, title, audio_url
    `;

    if (rows.length === 0) return error("Track not found", 404);

    return NextResponse.json({ ok: true, track: rows[0] });
  } catch (err) {
    console.error("PATCH /api/tracks error:", err);
    return error("Failed to update track", 500);
  }
}

/* DELETE /api/tracks?trackId=... */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");

    if (!trackId) return error("trackId is required");

    const rows = await sql`
      DELETE FROM tracks
      WHERE track_id = ${trackId}
      RETURNING track_id
    `;

    if (rows.length === 0) return error("Track not found", 404);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/tracks error:", err);
    return error("Failed to delete track", 500);
  }
}
