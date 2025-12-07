import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";

// GET  /api/account/profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const artistId = (session.user as any).artistId as string | undefined;

    if (!artistId) {
      return NextResponse.json(
        { error: "No artist ID on session" },
        { status: 400 }
      );
    }

    const result = await query(
      `
      SELECT artist_id,
             display_name,
             bio,
             genre,
             instagram,
             twitter,
             website,
             avatar_url
      FROM artist_profiles
      WHERE artist_id = $1
    `,
      [artistId]
    );

    if (result.rows.length === 0) {
      // Return empty default profile if not created yet
      return NextResponse.json({
        ok: true,
        profile: {
          artist_id: artistId,
          display_name: "",
          bio: "",
          genre: "",
          instagram: "",
          twitter: "",
          website: "",
          avatar_url: "",
        },
      });
    }

    return NextResponse.json({ ok: true, profile: result.rows[0] });
  } catch (err) {
    console.error("Error loading artist profile:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

// POST  /api/account/profile  (create/update)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const artistId = (session.user as any).artistId as string | undefined;

    if (!artistId) {
      return NextResponse.json(
        { error: "No artist ID on session" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      displayName,
      bio,
      genre,
      instagram,
      twitter,
      website,
      avatarUrl,
    } = body;

    await query(
      `
      INSERT INTO artist_profiles (
        artist_id,
        display_name,
        bio,
        genre,
        instagram,
        twitter,
        website,
        avatar_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (artist_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        bio          = EXCLUDED.bio,
        genre        = EXCLUDED.genre,
        instagram    = EXCLUDED.instagram,
        twitter      = EXCLUDED.twitter,
        website      = EXCLUDED.website,
        avatar_url   = EXCLUDED.avatar_url
    `,
      [artistId, displayName, bio, genre, instagram, twitter, website, avatarUrl]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error saving artist profile:", err);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
