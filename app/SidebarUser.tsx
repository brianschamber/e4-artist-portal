"use client";

import { useSession } from "next-auth/react";

export function SidebarUser() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div style={{ fontSize: 12, color: "#777", marginTop: "auto" }}>
        Not signed in
      </div>
    );
  }

  // Use a loose type here so TS stops complaining about custom fields
  const user: any = session.user || {};

  return (
    <div style={{ fontSize: 12, color: "#aaa", marginTop: "auto" }}>
      <div>Signed in as</div>
      <div style={{ color: "#fff" }}>{user.email}</div>

      {user.artistId && <div>Artist ID: {user.artistId}</div>}
      {user.role && <div>Role: {user.role}</div>}
    </div>
  );
}
