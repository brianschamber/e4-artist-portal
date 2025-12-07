import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { compare } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = (session.user as any).userId;
    const currentEmail = session.user.email;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID missing in session" },
        { status: 400 }
      );
    }

    const { currentPassword, newEmail } = await req.json();

    if (!currentPassword || !newEmail) {
      return NextResponse.json(
        { error: "Current password and new email are required" },
        { status: 400 }
      );
    }

    // Ensure newEmail is not same as current
    if (newEmail === currentEmail) {
      return NextResponse.json(
        { error: "New email cannot be the same as your current email" },
        { status: 400 }
      );
    }

    // Check if new email already exists for another user
    const existing = await query(
      `
      SELECT 1
      FROM users
      WHERE email = $1 AND user_id <> $2
    `,
      [newEmail, userId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "That email is already in use by another account" },
        { status: 400 }
      );
    }

    // Get current password hash for this user
    const result = await query(
      `
      SELECT password_hash
      FROM users
      WHERE user_id = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password_hash } = result.rows[0];

    const isValid = await compare(currentPassword, password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update the email
    await query(
      `
      UPDATE users
      SET email = $1
      WHERE user_id = $2
    `,
      [newEmail, userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error changing email:", err);
    return NextResponse.json(
      { error: "Something went wrong while updating email" },
      { status: 500 }
    );
  }
}
