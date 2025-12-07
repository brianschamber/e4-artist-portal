"use client";

import React, { useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: "error", message: "Missing reset token." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters long.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: "error",
          message: data.error ?? "Failed to reset password.",
        });
      } else {
        setStatus({
          type: "success",
          message: "Password reset successfully. Redirecting to login...",
        });

        setTimeout(() => {
          router.push("/login");
        }, 1500);
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
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Set a new password</h1>
        <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 24 }}>
          Choose a new password for your E4 account.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="newPassword" style={{ fontSize: 14 }}>
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="confirmPassword" style={{ fontSize: 14 }}>
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isSubmitting ? "Saving..." : "Save new password"}
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
