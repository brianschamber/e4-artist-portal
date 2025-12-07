import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Look up token
    const tokenRes = await query(
      `
      SELECT token, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token = $1
    `,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const row = tokenRes.rows[0];

    if (row.used_at) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > new Date(row.expires_at)) {
      return NextResponse.json(
        { error: "This reset link has expired" },
        { status: 400 }
      );
    }

    const userId = row.user_id;

    // Update password
    const newHash = await hash(newPassword, 10);

    await query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE user_id = $2
    `,
      [newHash, userId]
    );

    // Mark token used
    await query(
      `
      UPDATE password_reset_tokens
      SET used_at = now()
      WHERE token = $1
    `,
      [token]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in reset-password:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
