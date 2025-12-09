import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET /api/artist/profile → load current artist profile from Neon
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email as string;

    // 1) Look up the user by email to get artist_id
    const users = (await sql`
      SELECT user_id, email, artist_id, role
      FROM users
      WHERE email = ${email}
      LIMIT 1;
    `) as any[];

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    if (!user.artist_id) {
      return NextResponse.json(
        { error: "User has no linked artist profile" },
        { status: 404 }
      );
    }

    // 2) Load the artist row from artists
    const artists = (await sql`
      SELECT
        artist_id,
        name,
        email,
        bio,
        avatar_url,
        instagram,
        website,
        spotify_url,
        apple_music_url,
        soundcloud_url,
        youtube_url,
        tiktok_handle
      FROM artists
      WHERE artist_id = ${user.artist_id}
      LIMIT 1;
    `) as any[];

    if (artists.length === 0) {
      return NextResponse.json(
        { error: "Artist profile not found" },
        { status: 404 }
      );
    }

    const artist = artists[0];

    const payload = {
      artist_id: artist.artist_id,
      display_name: artist.name ?? "New Artist",
      bio: artist.bio ?? "",
      avatar_url: artist.avatar_url ?? "",
      instagram: artist.instagram ?? "",
      website: artist.website ?? "",
      email: artist.email ?? user.email,
      role: user.role,
      spotify_url: artist.spotify_url ?? "",
      apple_music_url: artist.apple_music_url ?? "",
      soundcloud_url: artist.soundcloud_url ?? "",
      youtube_url: artist.youtube_url ?? "",
      tiktok_handle: artist.tiktok_handle ?? "",
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("GET /api/artist/profile error:", err);
    return NextResponse.json(
      {
        error:
          typeof err?.message === "string"
            ? err.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/artist/profile → persist full profile to Neon
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionEmail = session.user.email as string;
    const body = await req.json();

    const {
      display_name,
      bio,
      website,
      instagram,
      twitter, // unused for now – no column yet
      avatar_url,
      email, // contact email from the form
      spotify_url,
      apple_music_url,
      soundcloud_url,
      youtube_url,
      tiktok_handle,
    } = body;

    // 1) Find the user to get artist_id
    const users = (await sql`
      SELECT user_id, email, artist_id, role
      FROM users
      WHERE email = ${sessionEmail}
      LIMIT 1;
    `) as any[];

    if (users.length === 0 || !users[0].artist_id) {
      return NextResponse.json(
        { error: "Artist profile not found" },
        { status: 404 }
      );
    }

    const artistId = users[0].artist_id as string;

    // 2) Update all profile-related columns on artists
    const updatedRows = (await sql`
      UPDATE artists
      SET
        name            = ${display_name ?? null},
        email           = ${email ?? null},
        bio             = ${bio ?? null},
        avatar_url      = ${avatar_url ?? null},
        instagram       = ${instagram ?? null},
        website         = ${website ?? null},
        spotify_url     = ${spotify_url ?? null},
        apple_music_url = ${apple_music_url ?? null},
        soundcloud_url  = ${soundcloud_url ?? null},
        youtube_url     = ${youtube_url ?? null},
        tiktok_handle   = ${tiktok_handle ?? null}
      WHERE artist_id = ${artistId}
      RETURNING
        artist_id,
        name,
        email,
        bio,
        avatar_url,
        instagram,
        website,
        spotify_url,
        apple_music_url,
        soundcloud_url,
        youtube_url,
        tiktok_handle;
    `) as any[];

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Artist profile not found after update" },
        { status: 404 }
      );
    }

    const updated = updatedRows[0];

    return NextResponse.json({
      artist_id: updated.artist_id,
      display_name: updated.name ?? "New Artist",
      bio: updated.bio ?? "",
      avatar_url: updated.avatar_url ?? "",
      instagram: updated.instagram ?? "",
      website: updated.website ?? "",
      email: updated.email ?? sessionEmail,
      spotify_url: updated.spotify_url ?? "",
      apple_music_url: updated.apple_music_url ?? "",
      soundcloud_url: updated.soundcloud_url ?? "",
      youtube_url: updated.youtube_url ?? "",
      tiktok_handle: updated.tiktok_handle ?? "",
    });
  } catch (err: any) {
    console.error("PUT /api/artist/profile error:", err);
    return NextResponse.json(
      {
        error:
          typeof err?.message === "string"
            ? err.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
