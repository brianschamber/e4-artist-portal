import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type PasswordResetEmailProps = {
  to: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: PasswordResetEmailProps) {
  const hasKey = !!process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM || "E4 Artist Portal <no-reply@e4entertainmentgroup.com>";

  console.log("[EMAIL] sendPasswordResetEmail called");
  console.log("[EMAIL] To:", to);
  console.log("[EMAIL] Reset URL:", resetUrl);
  console.log("[EMAIL] API key present:", hasKey);
  console.log("[EMAIL] From:", from);

  if (!hasKey) {
    console.warn(
      "[EMAIL] RESEND_API_KEY missing – skipping send. Reset URL was:",
      resetUrl
    );
    return;
  }

  const response = await resend.emails.send({
    from,
    to,
    subject: "Reset your E4 Artist Portal password",
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #ffffff; background: #000000; padding: 24px;">
        <div style="max-width: 480px; margin: 0 auto; background: #0b0b0b; border-radius: 16px; padding: 24px; border: 1px solid #222;">
          <h1 style="font-size: 22px; margin-bottom: 12px; color: #f5f5f5;">
            Reset your password
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: #cccccc;">
            We received a request to reset the password for your E4 Artist Portal account.
            Click the button below to set a new password.
          </p>
          <p style="margin: 24px 0;">
            <a
              href="${resetUrl}"
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
              Reset password
            </a>
          </p>
          <p style="font-size: 12px; line-height: 1.6; color: #aaaaaa;">
            If the button above doesn&apos;t work, copy and paste this link into your browser:
            <br />
            <span style="word-break: break-all; color: #eeeeee;">
              ${resetUrl}
            </span>
          </p>
          <p style="font-size: 12px; color: #777777; margin-top: 16px;">
            If you didn&apos;t request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  console.log("[EMAIL] Resend response:", JSON.stringify(response, null, 2));
}
