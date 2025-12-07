"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({
          type: "error",
          message: data.error ?? "Unable to send reset link.",
        });
      } else {
        setStatus({
          type: "success",
          message:
            "If an account exists for that email, a reset link has been generated. (Check server logs in this dev build.)",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Unexpected error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0b0b0b",
          border: "1px solid #222",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 20px 45px rgba(0,0,0,0.85)",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Reset your password</h1>
        <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 24 }}>
          Enter the email associated with your E4 account. We&apos;ll generate a reset link.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="email" style={{ fontSize: 14 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#000",
                color: "#fff",
                fontSize: 14,
              }}
            />
          </div>

          {status && (
            <div
              style={{
                marginTop: 4,
                padding: "8px 10px",
                borderRadius: 8,
                border:
                  status.type === "success"
                    ? "1px solid #2e7d32"
                    : "1px solid #aa0000",
                background:
                  status.type === "success" ? "#102915" : "#2b0000",
                color:
                  status.type === "success" ? "#a5d6a7" : "#ffb3b3",
                fontSize: 13,
              }}
            >
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: isSubmitting ? "#555" : "#d4af37",
              color: "#000",
              fontWeight: 600,
              cursor: isSubmitting ? "default" : "pointer",
              fontSize: 15,
            }}
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          <Link href="/login" style={{ color: "#d4af37", textDecoration: "none" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
