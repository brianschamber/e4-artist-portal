"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (password.length < 8) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters long.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artistName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: "error",
          message: data.error ?? "Failed to create account.",
        });
      } else {
        setStatus({
          type: "success",
          message: "Account created. Redirecting to login...",
        });
        // Small delay then go to login
        setTimeout(() => {
          router.push("/login");
        }, 1200);
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
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#0b0b0b",
          borderRadius: 24,
          padding: "32px 32px 28px",
          boxShadow: "0 18px 45px rgba(0,0,0,0.9)",
          border: "1px solid #222",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            marginBottom: 8,
          }}
        >
          E4 Artist Portal
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 24, fontSize: 14 }}>
          Create your E4 artist account to manage releases, tracks, and earnings.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="artistName" style={{ fontSize: 14 }}>
              Artist / Project Name
            </label>
            <input
              id="artistName"
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#000",
                color: "#fff",
              }}
            />
          </div>

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
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="password" style={{ fontSize: 14 }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#000",
                color: "#fff",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="confirmPassword" style={{ fontSize: 14 }}>
              Confirm Password
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
              marginTop: 4,
              width: "100%",
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: isSubmitting ? "#555" : "#d4af37",
              color: "#000",
              fontWeight: 600,
              cursor: isSubmitting ? "default" : "pointer",
              fontSize: 15,
            }}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            fontSize: 13,
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#d4af37", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
