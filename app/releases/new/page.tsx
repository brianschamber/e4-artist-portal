"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { E4PageHeader } from "../../components/ui/E4PageHeader";
import { E4Card } from "../../components/ui/E4Card";
import { E4Input } from "../../components/ui/E4Input";
import { E4Button } from "../../components/ui/E4Button";

export default function NewReleasePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Pull artistId from the logged-in user
  const artistId = (session as any)?.user?.artistId ?? "";

  // Optional: kick to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!artistId) {
      setMessage("Missing artist ID from session.");
      return;
    }
    if (!title.trim()) {
      setMessage("Please enter a release title.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // send both forms just in case the API expects one or the other
          artist_id: artistId,
          artistId,
          title,
          release_date: releaseDate || null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Create release failed:", res.status, errorText);
        setMessage(errorText || "Failed to create release.");
        return;
      }

      // On success, go back to releases list
      router.push("/releases");
    } catch (err) {
      console.error(err);
      setMessage("There was a problem creating the release.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <E4PageHeader
        title="Create New Release"
        subtitle="Set up a new project for this artist."
      />

      <E4Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Artist ID (read-only, from session) */}
          <E4Input
            id="artist-id"
            label="Current Artist ID"
            value={artistId}
            readOnly
          />

          {/* Release title */}
          <E4Input
            id="release-title"
            label="Release Title *"
            placeholder="e.g. My EP, Summer 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Release date (optional) */}
          <E4Input
            id="release-date"
            label="Release Date (optional)"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />

          {message && (
            <p
              style={{
                fontSize: "0.8rem",
                color: message.toLowerCase().includes("problem")
                  ? "#f97373"
                  : "#facc15",
              }}
            >
              {message}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <E4Button
              type="submit"
              variant="gold"
              disabled={saving || !artistId}
            >
              {saving ? "Creating..." : "Create Release"}
            </E4Button>
          </div>
        </form>
      </E4Card>
    </div>
  );
}
