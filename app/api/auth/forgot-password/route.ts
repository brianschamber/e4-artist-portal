import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const userRes = await query(
      `
      SELECT user_id
      FROM users
      WHERE email = $1
    `,
      [email]
    );

    // Always respond success (avoid leaking which emails exist)
    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const userId = userRes.rows[0].user_id;
    const token = randomUUID();

    // 1 hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await query(
      `
      INSERT INTO password_reset_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
    `,
      [token, userId, expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email via Resend (or log if no API key)
    await sendPasswordResetEmail({ to: email, resetUrl });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in forgot-password:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
