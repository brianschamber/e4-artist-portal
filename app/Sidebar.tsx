"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/releases", label: "Releases" },
  { href: "/tracks", label: "Tracks" },
  { href: "/earnings", label: "Earnings" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const email = session?.user?.email ?? "Not signed in";

  return (
    <aside className="sidebar">
      {/* TOP: Logo + Title + Nav */}
      <div>
        {/* Logo Row */}
        <div className="sidebar-logo-row">
          <div className="sidebar-logo">
            <Image
              src="/e4-logo.png"
              alt="E4 Entertainment"
              width={40}
              height={40}
            />
          </div>

          <div>
            <div className="sidebar-title">E4</div>
            <div className="sidebar-subtitle">Artist Portal</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM: User Info + Sign Out */}
      <div className="sidebar-user">
        <div style={{ marginBottom: "8px", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.16em" }}>
          Signed in as
        </div>
        <strong style={{ display: "block", marginBottom: "4px" }}>{email}</strong>

        {session && (
          <button
            type="button"
            onClick={() => signOut()}
            className="e4-btn-outline"
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "8px",
              fontSize: "0.8rem",
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
