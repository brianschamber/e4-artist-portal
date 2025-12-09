"use client";

import React, { useState, type FormEvent, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Hooks are ALWAYS called – no conditionals
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, send to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    // Let middleware enforce access, we just go to dashboard
    router.replace("/dashboard");
  }

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        Checking your session…
      </div>
    );
  }

  // While redirecting after login
  if (status === "authenticated") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        Redirecting to your dashboard…
      </div>
    );
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
