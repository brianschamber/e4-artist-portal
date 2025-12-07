import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { query } from "@/lib/db";

// Needed so we can use fs/path in the app router
export const runtime = "nodejs";

/* =========================================================
   GET /api/tracks
   - /api/tracks?releaseId=... → tracks for that release
   - /api/tracks              → all tracks
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const releaseId = searchParams.get("releaseId");

    let sql: string;
    let params: any[] = [];

    if (releaseId) {
      sql = `
        SELECT track_id, release_id, track_number, title, audio_url
        FROM tracks
        WHERE release_id = $1
        ORDER BY track_number NULLS LAST, created_at ASC;
      `;
      params = [releaseId];
    } else {
      sql = `
        SELECT track_id, release_id, track_number, title, audio_url
        FROM tracks
        ORDER BY created_at DESC, track_number NULLS LAST;
      `;
      params = [];
    }

    const result = await query(sql, params);
    return NextResponse.json({ ok: true, tracks: result.rows });
  } catch (err: any) {
    console.error("Error loading tracks:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/tracks  → create track

   ✅ Supports BOTH:
   1) multipart/form-data (direct file upload)
      - releaseId     (text, required)
      - title         (text, required)
      - trackNumber   (text, optional)
      - audioFile     (file, optional – if present, saved to /public/uploads)

   2) application/json
      {
        releaseId: string;
        title: string;
        trackNumber?: number | null;
        audioUrl?: string | null;  // e.g. from /api/uploads/audio
      }

   In JSON mode, audio is OPTIONAL (you can attach later).
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let releaseId: string = "";
    let title: string = "";
    let trackNumber: number | null = null;
    let audioUrl: string | null = null;
    let audioFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      // ---------- FORM-DATA PATH (direct file upload) ----------
      const formData = await req.formData();

      const releaseIdVal = formData.get("releaseId");
      const titleVal = formData.get("title");
      const trackNumberRaw = formData.get("trackNumber");
      const audioFileVal = formData.get("audioFile");

      if (!releaseIdVal || typeof releaseIdVal !== "string") {
        return NextResponse.json(
          { ok: false, error: "releaseId is required." },
          { status: 400 }
        );
      }

      if (!titleVal || typeof titleVal !== "string" || !titleVal.trim()) {
        return NextResponse.json(
          { ok: false, error: "Track title is required." },
          { status: 400 }
        );
      }

      releaseId = releaseIdVal;
      title = titleVal.trim();

      trackNumber =
        typeof trackNumberRaw === "string" && trackNumberRaw.trim() !== ""
          ? Number(trackNumberRaw)
          : null;

      if (audioFileVal instanceof File) {
        audioFile = audioFileVal;
      }
    } else {
      // ---------- JSON PATH ----------
      const body = await req.json();

      releaseId = (body.releaseId || "").trim();
      title = (body.title || "").trim();
      trackNumber =
        body.trackNumber === undefined || body.trackNumber === null
          ? null
          : Number(body.trackNumber);
      audioUrl = body.audioUrl ?? null;

      if (!releaseId) {
        return NextResponse.json(
          { ok: false, error: "releaseId is required." },
          { status: 400 }
        );
      }

      if (!title) {
        return NextResponse.json(
          { ok: false, error: "Track title is required." },
          { status: 400 }
        );
      }
      // In JSON mode we allow audioUrl to be null (you can attach later)
    }

    // ---------- If we received a file, save it to /public/uploads ----------
    if (audioFile) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      const originalName =
        typeof audioFile.name === "string" && audioFile.name.length > 0
          ? audioFile.name
          : "track-audio";

      const sanitizedName = originalName.replace(/\s+/g, "_");
      const uniqueName = `${Date.now()}-${sanitizedName}`;
      const filePath = path.join(uploadsDir, uniqueName);

      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);

      // URL that the app can serve (from /public)
      audioUrl = `/uploads/${uniqueName}`;
    }

    const insertSql = `
      INSERT INTO tracks (
        release_id,
        track_number,
        title,
        audio_url
      )
      VALUES ($1, $2, $3, $4)
      RETURNING track_id, release_id, track_number, title, audio_url;
    `;

    const result = await query(insertSql, [
      releaseId,
      trackNumber,
      title,
      audioUrl,
    ]);

    const newTrack = result.rows[0];

    return NextResponse.json({ ok: true, track: newTrack });
  } catch (err: any) {
    console.error("Error creating track:", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Failed to create track." },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/tracks  → edit a track (JSON only)
========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const trackId = (body.trackId || "").trim();
    const title = (body.title || "").trim();
    const trackNumber = body.trackNumber ?? null;
    const audioUrl = body.audioUrl || null;

    if (!trackId || !title) {
      return NextResponse.json(
        { ok: false, error: "trackId and title are required." },
        { status: 400 }
      );
    }

    const updateSql = `
      UPDATE tracks
      SET
        title = $1,
        track_number = $2,
        audio_url = $3
      WHERE track_id = $4
      RETURNING track_id, release_id, track_number, title, audio_url;
    `;

    const result = await query(updateSql, [
      title,
      trackNumber,
      audioUrl,
      trackId,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Track not found." },
        { status: 404 }
      );
    }

    const updatedTrack = result.rows[0];
    return NextResponse.json({ ok: true, track: updatedTrack });
  } catch (err: any) {
    console.error("Error updating track:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/tracks?trackId=...
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");

    if (!trackId) {
      return NextResponse.json(
        { ok: false, error: "trackId is required" },
        { status: 400 }
      );
    }

    const deleteSql = `
      DELETE FROM tracks
      WHERE track_id = $1
      RETURNING track_id;
    `;

    const result = await query(deleteSql, [trackId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Track not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error deleting track:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
