"use client";

import { signOut } from "next-auth/react";

export default function SidebarUser({ user }: { user: any }) {
  return (
    <div className="sidebar-user">
      <div style={{ marginBottom: "12px", lineHeight: "1.4" }}>
        <div>Signed in as</div>
        <strong>{user?.email ?? "—"}</strong>
        {user?.artistId && (
          <div style={{ marginTop: "4px" }}>
            <span style={{ color: "#bbb" }}>Artist ID:</span> {user.artistId}
          </div>
        )}
        {user?.role && (
          <div>
            <span style={{ color: "#bbb" }}>Role:</span> {user.role}
          </div>
        )}
      </div>

      <button
        onClick={() => signOut()}
        className="e4-btn-ghost"
        style={{
          width: "100%",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "0.9rem",
          textAlign: "center",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
