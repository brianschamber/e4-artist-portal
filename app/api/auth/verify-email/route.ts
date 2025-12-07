import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing verification token." },
        { status: 400 }
      );
    }

    const tokenRes = await query(
      `
      SELECT token, user_id, expires_at, used_at
      FROM email_verification_tokens
      WHERE token = $1
    `,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification link." },
        { status: 400 }
      );
    }

    const row = tokenRes.rows[0];

    if (row.used_at) {
      return NextResponse.json(
        { error: "This verification link has already been used." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > new Date(row.expires_at)) {
      return NextResponse.json(
        { error: "This verification link has expired." },
        { status: 400 }
      );
    }

    const userId = row.user_id;

    // Mark user as verified
    await query(
      `
      UPDATE users
      SET email_verified = true
      WHERE user_id = $1
    `,
      [userId]
    );

    // Mark token as used
    await query(
      `
      UPDATE email_verification_tokens
      SET used_at = now()
      WHERE token = $1
    `,
      [token]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error verifying email:", err);
    return NextResponse.json(
      { error: "Something went wrong while verifying your email." },
      { status: 500 }
    );
  }
}
