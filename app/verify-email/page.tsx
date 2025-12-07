"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status =
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>({
    type: "loading",
    message: "Verifying your email...",
  });

  useEffect(() => {
    if (!token) {
      setStatus({
        type: "error",
        message: "Missing verification token.",
      });
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus({
            type: "error",
            message: data.error ?? "Unable to verify email.",
          });
        } else {
          setStatus({
            type: "success",
            message: "Your email has been verified. You can now sign in.",
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
      }
    }

    verify();
  }, [token, router]);

  const borderColor =
    status.type === "loading"
      ? "#444"
      : status.type === "success"
      ? "#2e7d32"
      : "#aa0000";

  const bgColor =
    status.type === "loading"
      ? "#111"
      : status.type === "success"
      ? "#102915"
      : "#2b0000";

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
          maxWidth: 480,
          background: "#0b0b0b",
          borderRadius: 20,
          padding: "32px 28px",
          border: `1px solid ${borderColor}`,
          boxShadow: "0 20px 45px rgba(0,0,0,0.85)",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Email verification</h1>
        <div
          style={{
            marginTop: 12,
            padding: "12px 12px",
            borderRadius: 12,
            background: bgColor,
            fontSize: 14,
          }}
        >
          {status.message}
        </div>

        {status.type === "error" && (
          <div
            style={{
              marginTop: 20,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            <Link
              href="/login"
              style={{ color: "#d4af37", textDecoration: "none" }}
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
