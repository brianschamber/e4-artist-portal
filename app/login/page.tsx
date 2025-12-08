"use client";

import React, { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Try to sign in, but don't overthink the result.
    // We will ALWAYS attempt to go to /dashboard afterwards.
    await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    // Always go to /dashboard. If login failed, middleware on /dashboard
    // will bounce you back to /login. If it succeeded, you'll stay there.
    window.location.href = "/dashboard";
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
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>E4 Artist Portal</h1>
        <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 24 }}>
          Sign in to manage your releases, tracks, and earnings.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Email */}
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

          {/* Password */}
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
                fontSize: 14,
              }}
            />
          </div>

          {/* Forgot password */}
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              textAlign: "right",
            }}
          >
            <Link
              href="/forgot-password"
              style={{ color: "#d4af37", textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Error Message (optional – you can wire this up later) */}
          {error && (
            <div
              style={{
                background: "#330000",
                border: "1px solid #662222",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 13,
                color: "#ff9999",
              }}
            >
              {error}
            </div>
          )}

          {/* Sign In button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: isLoading ? "#555" : "#d4af37",
              color: "#000",
              fontWeight: 600,
              cursor: isLoading ? "default" : "pointer",
              fontSize: 15,
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Signup link */}
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{ color: "#d4af37", textDecoration: "none" }}
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
