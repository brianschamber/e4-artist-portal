import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { compare, hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = (session.user as any).userId;
    if (!userId) {
      return NextResponse.json({ error: "User ID missing in session" }, { status: 400 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Get current password hash from DB
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

    // Hash the new password
    const newHash = await hash(newPassword, 10);

    await query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE user_id = $2
    `,
      [newHash, userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error changing password:", err);
    return NextResponse.json(
      { error: "Something went wrong while updating password" },
      { status: 500 }
    );
  }
}
