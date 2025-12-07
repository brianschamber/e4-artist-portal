// app/api/releases/[releaseId]/cover/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { sql } from "../../../../../lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { releaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Adjust this if your session shape is different
    const artistId = (session.user as any).artist_id;
    if (!artistId) {
      return NextResponse.json(
        { error: "Missing artist_id on session" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const coverUrl = (body?.cover_url as string | undefined)?.trim();

    if (!coverUrl) {
      return NextResponse.json(
        { error: "cover_url must be a non-empty string" },
        { status: 400 }
      );
    }

    const { releaseId } = params;

    // Only allow updating releases owned by this artist
const result = (await sql`
  UPDATE public.releases
  SET cover_url = ${coverUrl}
  WHERE release_id = ${releaseId}
    AND artist_id = ${artistId}
  RETURNING '1' AS updated;
`) as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Release not found or not owned by artist" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, cover_url: coverUrl });
  } catch (err) {
    console.error("Error updating cover_url:", err);
    return NextResponse.json(
      { error: "Failed to update cover_url" },
      { status: 500 }
    );
  }
}
