import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(to: string, verifyUrl: string) {
  const from =
    process.env.EMAIL_FROM || "E4 Artist Portal <no-reply@e4entertainmentgroup.com>";

  await resend.emails.send({
    from,
    to,
    subject: "Verify your E4 Artist Portal email",
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #ffffff; background: #000000; padding: 24px;">
        <div style="max-width: 480px; margin: 0 auto; background: #0b0b0b; border-radius: 16px; padding: 24px; border: 1px solid #222;">
          <h1 style="font-size: 22px; margin-bottom: 12px; color: #f5f5f5;">
            Verify your email
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: #cccccc;">
            Welcome to the E4 Artist Portal. Please confirm your email address to activate your account.
          </p>
          <p style="margin: 24px 0;">
            <a
              href="${verifyUrl}"
              style="
                display: inline-block;
                padding: 10px 18px;
                border-radius: 999px;
                background: #d4af37;
                color: #000000;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
              "
            >
              Verify email
            </a>
          </p>
          <p style="font-size: 12px; line-height: 1.6; color: #aaaaaa;">
            If the button above doesn&apos;t work, copy and paste this link into your browser:
            <br />
            <span style="word-break: break-all; color: #eeeeee;">
              ${verifyUrl}
            </span>
          </p>
          <p style="font-size: 12px; color: #777777; margin-top: 16px;">
            If you didn&apos;t create this account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { artistName, email, password } = await req.json();

    if (!artistName || !email || !password) {
      return NextResponse.json(
        { error: "Artist name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await query(
      `
      SELECT 1
      FROM users
      WHERE email = $1
    `,
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 400 }
      );
    }

    // 🔑 Generate NEW IDs per request (THIS is the important part)
    const userId = randomUUID();
    const artistId = randomUUID();

    const passwordHash = await hash(password, 10);

    // 1) Create artist row (using column name "name" from your schema)
    await query(
      `
      INSERT INTO artists (artist_id, name, email)
      VALUES ($1, $2, $3)
    `,
      [artistId, artistName, email]
    );

    // 2) Create artist profile row
    await query(
      `
      INSERT INTO artist_profiles (artist_id, display_name)
      VALUES ($1, $2)
      ON CONFLICT (artist_id) DO NOTHING
    `,
      [artistId, artistName]
    );

    // 3) Create user row linked to that artist, email_verified = false
    await query(
      `
      INSERT INTO users (user_id, email, password_hash, artist_id, role, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [userId, email, passwordHash, artistId, "artist", false]
    );

    // 4) Create verification token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await query(
      `
      INSERT INTO email_verification_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
    `,
      [token, userId, expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    // 5) Send verification email
    await sendVerificationEmail(email, verifyUrl);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error registering user:", err);
    return NextResponse.json(
      { error: "Something went wrong while creating your account." },
      { status: 500 }
    );
  }
}
