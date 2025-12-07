"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { E4Button } from "../components/ui/E4Button";
import { E4Card } from "../components/ui/E4Card";
import { E4PageHeader } from "../components/ui/E4PageHeader";
import { E4Input } from "../components/ui/E4Input";

type Release = {
  release_id: string;
  artist_id: string;
  label_id?: string | null;
  title: string | null;
  release_date: string | null;
  cover_url?: string | null;
  created_at: string;
  upc?: string | null;
  artist_split?: string | null;
  label_split?: string | null;
  status: string;
};

export default function ReleasesPage() {
  const { data: session, status } = useSession();

  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Current artistId comes from the logged-in user ONLY
  const [currentArtistId, setCurrentArtistId] = useState("");

  // Pull artistId from the session
  useEffect(() => {
    if (status === "loading") return;

    const artistIdFromSession = (session?.user as any)?.artistId as
      | string
      | undefined;

    if (artistIdFromSession) {
      setCurrentArtistId(artistIdFromSession);
    } else {
      setCurrentArtistId("");
    }
  }, [session, status]);

  // Load releases
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/releases");
        const data = await res.json();
        if (data.ok && Array.isArray(data.releases)) {
          setReleases(data.releases);
        } else {
          console.error("Unexpected releases payload:", data);
        }
      } catch (err) {
        console.error("Error loading releases:", err);
      } finally {
        setLoading(false);
      }
    }

    // Only load once we know the session state
    if (status !== "loading") {
      load();
    }
  }, [status]);

  // First: scope releases to the current artist
  const artistScoped = currentArtistId
    ? releases.filter((rel) => rel.artist_id === currentArtistId)
    : releases;

  // Then: apply search filter
  const filtered = artistScoped.filter((rel) => {
    const title = rel.title || "";
    const statusText = rel.status || "";
    const artistId = rel.artist_id || "";
    const q = search.toLowerCase();
    return (
      title.toLowerCase().includes(q) ||
      statusText.toLowerCase().includes(q) ||
      artistId.toLowerCase().includes(q)
    );
  });

  if (loading || status === "loading") {
    return <div style={{ padding: 24 }}>Loading releases…</div>;
  }

  return (
    <div>
      {/* Top header */}
      <E4PageHeader
        title="Your Releases"
        subtitle="Manage your catalog, edit drops, and prepare upcoming releases."
        actions={
          <Link href="/releases/new">
            <E4Button variant="gold">+ New Release</E4Button>
          </Link>
        }
      />

      {/* Current Artist bar */}
      <div style={{ marginBottom: 16 }}>
        <E4Card>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ flex: "2 1 240px" }}>
              <label
                style={{
                  fontSize: 14,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Current Artist ID
              </label>
              <E4Input
                value={currentArtistId}
                readOnly
                style={{ opacity: 0.8, cursor: "default" }}
              />
            </div>

            <div
              style={{
                flex: "1 1 160px",
                fontSize: 13,
                color: "#aaa",
              }}
            >
              {currentArtistId ? (
                <div>
                  <div>Showing releases for this artist only.</div>
                  <div style={{ marginTop: 4 }}>
                    <strong>Artist ID:</strong> {currentArtistId}
                  </div>
                </div>
              ) : (
                <div>No artist ID found for this account.</div>
              )}
            </div>
          </div>
        </E4Card>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <E4Input
          placeholder="Search by title, status, or artist ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ marginTop: 16 }}>No releases found.</div>
      )}

      {/* Release cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map((rel) => (
          <Link
            key={rel.release_id}
            href={`/releases/${rel.release_id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <E4Card>
              <h2 style={{ margin: 0, fontSize: 22 }}>
                {rel.title && rel.title.trim().length > 0
                  ? rel.title
                  : "(Untitled Release)"}
              </h2>

              <p style={{ margin: "6px 0" }}>Artist ID: {rel.artist_id}</p>

              <p style={{ margin: "4px 0" }}>
                Created: {new Date(rel.created_at).toLocaleString()}
              </p>

              <p style={{ margin: "4px 0" }}>Status: {rel.status}</p>
            </E4Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
