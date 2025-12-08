"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar"; // ✅ correct path

export default function ProtectedShell({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main
        style={{
          flex: 1,
          padding: "32px 48px",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1200px" }}>{children}</div>
      </main>
    </div>
  );
}
