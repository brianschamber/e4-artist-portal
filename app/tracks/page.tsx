"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { E4Button } from "../components/ui/E4Button";
import { E4Card } from "../components/ui/E4Card";
import { E4PageHeader } from "../components/ui/E4PageHeader";
import { E4Input } from "../components/ui/E4Input";

type Track = {
  track_id: string;
  release_id: string;
  track_number: number | null;
  title: string | null;
  audio_url?: string | null;
};

export default function TracksPage() {
  // Form state
  const [title, setTitle] = useState("");
  const [trackNumber, setTrackNumber] = useState("");
  const [releaseId, setReleaseId] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState("");

  // List state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -----------------------------------------
     LOAD ALL TRACKS
  ----------------------------------------- */
  useEffect(() => {
    async function loadTracks() {
      try {
        const res = await fetch("/api/tracks");
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.error || "Failed to load tracks.");
          return;
        }
        setTracks(data.tracks);
      } catch (err) {
        console.error("Error loading tracks:", err);
        setError("Failed to load tracks.");
      } finally {
        setLoading(false);
      }
    }

    loadTracks();
  }, []);

  /* -----------------------------------------
     FILE HANDLER
  ----------------------------------------- */
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    setAudioFileName(file ? file.name : "");
  }

  /* -----------------------------------------
     UPLOAD TRACK (multipart/form-data)
  ----------------------------------------- */
  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Track title is required.");
      return;
    }

    if (!releaseId.trim()) {
      // DB requires a release_id for now
      setError("Release ID is required for this upload flow.");
      return;
    }

    if (!audioFile) {
      setError("Please choose an audio file.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("releaseId", releaseId.trim());
      if (trackNumber.trim()) {
        formData.append("trackNumber", trackNumber.trim());
      }
      formData.append("audioFile", audioFile);

      const res = await fetch("/api/tracks", {
        method: "POST",
        body: formData, // browser sets multipart boundary
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to upload track.");
        return;
      }

      // Prepend new track so it shows at the top
      setTracks((prev) => [data.track, ...prev]);

      // Reset form
      setTitle("");
      setTrackNumber("");
      setReleaseId("");
      setAudioFile(null);
      setAudioFileName("");
    } catch (err) {
      console.error("Upload error:", err);
      setError("Unexpected error uploading track.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <E4PageHeader
        title="Your Tracks"
        subtitle="Upload and manage individual songs in your E4 catalog."
      />

      {error && (
        <div
          style={{
            color: "#ff6b6b",
            marginBottom: 12,
            whiteSpace: "pre-line",
          }}
        >
          {error}
        </div>
      )}

      {/* Upload form */}
      <E4Card>
        <form
          onSubmit={handleUpload}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label
              style={{ fontSize: 14, display: "block", marginBottom: 4 }}
            >
              Track Title *
            </label>
            <E4Input
              value={title}
              placeholder="e.g. Midnight in Cleveland"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ flex: "1 1 180px" }}>
              <label
                style={{ fontSize: 14, display: "block", marginBottom: 4 }}
              >
                Track # (optional)
              </label>
              <E4Input
                value={trackNumber}
                placeholder="e.g. 1"
                onChange={(e) => setTrackNumber(e.target.value)}
              />
            </div>

            <div style={{ flex: "1 1 220px" }}>
              <label
                style={{ fontSize: 14, display: "block", marginBottom: 4 }}
              >
                Release ID (required for now)
              </label>
              <E4Input
                value={releaseId}
                placeholder="Link this track to a release"
                onChange={(e) => setReleaseId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              style={{ fontSize: 14, display: "block", marginBottom: 4 }}
            >
              Audio File *
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              style={{ fontSize: 12 }}
            />
            {audioFileName && (
              <p
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#888",
                  wordBreak: "break-all",
                }}
              >
                Selected: {audioFileName}
              </p>
            )}
            <p
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#888",
              }}
            >
              Upload a high-quality audio file (MP3, WAV, AAC, etc.).
            </p>
          </div>

          <E4Button type="submit" variant="gold" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload Track"}
          </E4Button>
        </form>
      </E4Card>

      {/* Track list */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 12 }}>All Tracks</h2>

        {loading && <p>Loading tracks…</p>}

        {!loading && tracks.length === 0 && (
          <p>No tracks uploaded yet.</p>
        )}

        {!loading && tracks.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {tracks.map((track) => (
              <E4Card key={track.track_id}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 16 }}>
                        <strong>
                          {track.track_number != null
                            ? `${track.track_number}. `
                            : ""}
                        </strong>
                        {track.title || "(Untitled Track)"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#888",
                        }}
                      >
                        Release ID: {track.release_id}
                      </p>
                    </div>
                  </div>

                  {track.audio_url && (
                    <div style={{ marginTop: 8 }}>
                      <audio
                        controls
                        src={track.audio_url}
                        style={{ width: "100%" }}
                      />
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: "#999",
                          wordBreak: "break-all",
                        }}
                      >
                        Source: {track.audio_url}
                      </p>
                    </div>
                  )}
                </div>
              </E4Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
