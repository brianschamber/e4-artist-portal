"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { E4Button } from "../../components/ui/E4Button";
import { E4Card } from "../../components/ui/E4Card";
import { E4PageHeader } from "../../components/ui/E4PageHeader";
import { E4Input } from "../../components/ui/E4Input";

// 🔹 NEW: Blob client imports
import { upload } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";

type Release = {
  release_id: string;
  artist_id: string;
  title: string | null;
  release_date: string | null;
  created_at: string;
  status: string;
  cover_url?: string | null;
};

type Track = {
  track_id: string;
  release_id: string;
  track_number: number | null;
  title: string | null;
  audio_url?: string | null;
};

export default function ReleaseDetailPage() {
  const { releaseId } = useParams<{ releaseId: string }>();

  const [release, setRelease] = useState<Release | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Release edit fields
  const [editReleaseTitle, setEditReleaseTitle] = useState<string>("");
  const [editReleaseStatus, setEditReleaseStatus] = useState<string>("Draft");
  const [editReleaseDate, setEditReleaseDate] = useState<string>("");

  // Cover state
  const [editCoverUrl, setEditCoverUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [savingRelease, setSavingRelease] = useState(false);

  // Add track fields
  const [trackTitle, setTrackTitle] = useState<string>("");
  const [trackNumber, setTrackNumber] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>(""); // optional manual URL
  const [audioFile, setAudioFile] = useState<File | null>(null); // optional file
  const [audioFileName, setAudioFileName] = useState<string>("");
  const [savingTrack, setSavingTrack] = useState(false);

  // Track edit fields
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editTrackNumber, setEditTrackNumber] = useState<string>("");
  const [editAudioUrl, setEditAudioUrl] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* -----------------------------------------
     LOAD RELEASE + TRACKS
  ----------------------------------------- */
  useEffect(() => {
    async function load() {
      try {
        // Load releases
        const relRes = await fetch("/api/releases");
        const relData = await relRes.json();

        if (relData.ok) {
          const found = relData.releases.find(
            (r: Release) => r.release_id === releaseId
          );

          if (found) {
            setRelease(found);
            setEditReleaseTitle(found.title || "");
            setEditReleaseStatus(found.status || "Draft");
            setEditReleaseDate(
              found.release_date ? found.release_date.substring(0, 10) : ""
            );
            setEditCoverUrl(found.cover_url || "");
            setCoverPreview(found.cover_url || null);
          }
        }

        // Load tracks
        const trRes = await fetch(`/api/tracks?releaseId=${releaseId}`);
        const trData = await trRes.json();
        if (trData.ok) setTracks(trData.tracks);
      } catch (err) {
        console.error("Error loading release detail:", err);
        setError("Failed to load release details.");
      } finally {
        setLoading(false);
      }
    }

    if (releaseId) load();
  }, [releaseId]);

  /* -----------------------------------------
     COVER FILE HANDLING
  ----------------------------------------- */
  function handleCoverFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);

    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(editCoverUrl || null);
    }
  }

  // 🔹 UPDATED: use Vercel Blob for covers
  async function uploadCoverIfNeeded(): Promise<string | null> {
    // If no new file selected, keep existing cover URL
    if (!coverFile) return editCoverUrl || null;

    try {
      setUploadingCover(true);

      const result: PutBlobResult = await upload(coverFile.name, coverFile, {
        access: "public",
        handleUploadUrl: "/api/uploads/cover",
        multipart: true,
      });

      setCoverFile(null);
      setCoverPreview(result.url);
      setEditCoverUrl(result.url);

      return result.url;
    } catch (err) {
      console.error("Error uploading cover:", err);
      setError("Failed to upload cover art.");
      // fall back to previous URL if we had one
      return editCoverUrl || null;
    } finally {
      setUploadingCover(false);
    }
  }

  /* -----------------------------------------
     AUDIO FILE HANDLING
  ----------------------------------------- */
  function handleAudioFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    setAudioFileName(file ? file.name : "");
  }

  // 🔹 UPDATED: use Vercel Blob for audio
  async function uploadAudioIfNeeded(): Promise<string | null> {
    // If no file picked, just use the manual URL field (or null)
    if (!audioFile) {
      return audioUrl.trim() ? audioUrl.trim() : null;
    }

    try {
      const result: PutBlobResult = await upload(audioFile.name, audioFile, {
        access: "public",
        handleUploadUrl: "/api/uploads/audio",
        multipart: true,
      });

      // Clear file info and use returned Blob URL
      setAudioFile(null);
      setAudioFileName("");
      setAudioUrl(result.url || "");

      return result.url;
    } catch (err) {
      console.error("Error uploading audio:", err);
      setError("Failed to upload audio file.");
      return null;
    }
  }

  /* -----------------------------------------
     SAVE RELEASE (with publishing rules)
  ----------------------------------------- */
  async function handleSaveRelease(e: FormEvent) {
    e.preventDefault();
    if (!releaseId) return;

    if (!editReleaseTitle.trim()) {
      setError("Release title is required.");
      return;
    }

    // Publishing rules only when marking as Released
    if (editReleaseStatus === "Released") {
      const problems: string[] = [];

      if (!editReleaseDate) {
        problems.push("Add a release date.");
      }

      const hasCover = Boolean(coverFile || editCoverUrl);
      if (!hasCover) {
        problems.push("Upload cover art.");
      }

      if (tracks.length === 0) {
        problems.push("Add at least one track.");
      }

      const hasAudio = tracks.some(
        (t) => t.audio_url && t.audio_url.trim().length > 0
      );
      if (!hasAudio) {
        problems.push("Attach audio to at least one track.");
      }

      if (problems.length > 0) {
        setError(
          "To mark this release as Released, please fix:\n- " +
            problems.join("\n- ")
        );
        return;
      }
    }

    setSavingRelease(true);
    setError(null);

    try {
      const coverUrlToSave = await uploadCoverIfNeeded();

      const res = await fetch("/api/releases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId,
          title: editReleaseTitle,
          status: editReleaseStatus,
          releaseDate: editReleaseDate || null,
          coverUrl: coverUrlToSave,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to update release.");
      } else {
        const updated: Release = data.release;
        setRelease(updated);

        setEditReleaseTitle(updated.title || "");
        setEditReleaseStatus(updated.status || "Draft");
        setEditReleaseDate(
          updated.release_date ? updated.release_date.substring(0, 10) : ""
        );
        setEditCoverUrl(updated.cover_url || "");
        setCoverPreview(updated.cover_url || null);
        setCoverFile(null);
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error updating release.");
    } finally {
      setSavingRelease(false);
    }
  }

  /* -----------------------------------------
     TRACK HANDLERS
  ----------------------------------------- */

  async function handleAddTrack(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!trackTitle.trim()) {
      setError("Track title is required.");
      return;
    }

    setSavingTrack(true);

    try {
      // 1) upload file if present, otherwise use URL field
      const audioUrlToSave = await uploadAudioIfNeeded();

      // if upload failed AND a file was selected, stop here
      if (!audioUrlToSave && audioFile) {
        setError("Audio upload failed. Track was not saved.");
        setSavingTrack(false);
        return;
      }

      // 2) create the track using JSON
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId,
          title: trackTitle.trim(),
          trackNumber: trackNumber ? Number(trackNumber) : null,
          audioUrl: audioUrlToSave, // string or null
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to create track.");
      } else {
        setTracks((prev) => [...prev, data.track]);
        setTrackTitle("");
        setTrackNumber("");
        setAudioUrl("");
        setAudioFile(null);
        setAudioFileName("");
      }
    } finally {
      setSavingTrack(false);
    }
  }

  function startEditTrack(track: Track) {
    setEditingTrackId(track.track_id);
    setEditTitle(track.title || "");
    setEditTrackNumber(
      track.track_number != null ? String(track.track_number) : ""
    );
    setEditAudioUrl(track.audio_url || "");
  }

  function cancelEditTrack() {
    setEditingTrackId(null);
    setEditTitle("");
    setEditTrackNumber("");
    setEditAudioUrl("");
  }

  async function handleSaveTrackEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingTrackId) return;

    if (!editTitle.trim()) {
      setError("Track title is required.");
      return;
    }

    setSavingEdit(true);
    setError(null);

    try {
      const res = await fetch("/api/tracks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: editingTrackId,
          title: editTitle.trim(),
          trackNumber: editTrackNumber ? Number(editTrackNumber) : null,
          audioUrl: editAudioUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to update track.");
      } else {
        setTracks((prev) =>
          prev.map((t) =>
            t.track_id === data.track.track_id ? data.track : t
          )
        );
        cancelEditTrack();
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTrack(trackId: string) {
    setError(null);

    try {
      const res = await fetch(`/api/tracks?trackId=${trackId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || (data.ok === false && data.error)) {
        setError(data.error || "Failed to delete track.");
      } else {
        setTracks((prev) => prev.filter((t) => t.track_id !== trackId));
        if (editingTrackId === trackId) cancelEditTrack();
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error deleting track.");
    }
  }

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */

  if (loading) {
    return <div style={{ padding: 24 }}>Loading release…</div>;
  }

  if (!release) {
    return (
      <div style={{ padding: 24 }}>
        <p>Release not found.</p>
        <Link href="/releases">
          <E4Button variant="outline">Back to Releases</E4Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <E4PageHeader
        title={release.title || "(Untitled Release)"}
        subtitle={`Release ID: ${release.release_id}`}
        actions={
          <Link href="/releases">
            <E4Button variant="ghost">Back to Releases</E4Button>
          </Link>
        }
      />

      {error && (
        <div
          style={{
            color: "#ff6b6b",
            whiteSpace: "pre-line",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* ------- Release Editor ------- */}
      <E4Card>
        <form
          onSubmit={handleSaveRelease}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div>
            <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
              Release Title *
            </label>
            <E4Input
              value={editReleaseTitle}
              onChange={(e) => setEditReleaseTitle(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {/* Status */}
            <div style={{ minWidth: 180 }}>
              <label
                style={{ fontSize: 14, display: "block", marginBottom: 4 }}
              >
                Status
              </label>
              <select
                value={editReleaseStatus}
                onChange={(e) => setEditReleaseStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #444",
                  backgroundColor: "#111",
                  color: "#fff",
                }}
              >
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Released">Released</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Date */}
            <div style={{ minWidth: 180 }}>
              <label
                style={{ fontSize: 14, display: "block", marginBottom: 4 }}
              >
                Release Date
              </label>
              <input
                type="date"
                value={editReleaseDate}
                onChange={(e) => setEditReleaseDate(e.target.value)}
                className="e4-input"
              />
            </div>

            {/* Cover Upload */}
            <div style={{ minWidth: 220 }}>
              <label
                style={{ fontSize: 14, display: "block", marginBottom: 4 }}
              >
                Cover Art
              </label>

              {coverPreview && (
                <div
                  style={{
                    marginBottom: 8,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #333",
                    width: 160,
                    height: 160,
                    backgroundColor: "#000",
                  }}
                >
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                style={{ fontSize: 12 }}
              />

              {editCoverUrl && !coverFile && (
                <p
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: "#888",
                    wordBreak: "break-all",
                  }}
                >
                  Current: {editCoverUrl}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 4,
              fontSize: 13,
              color: "#aaa",
            }}
          >
            <span>
              <strong>Artist ID:</strong> {release.artist_id}
            </span>
            <span>
              <strong>Created:</strong>{" "}
              {new Date(release.created_at).toLocaleString()}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 12,
              justifyContent: "flex-end",
            }}
          >
            <E4Button
              type="submit"
              variant="gold"
              disabled={savingRelease || uploadingCover}
            >
              {savingRelease || uploadingCover
                ? "Saving Release…"
                : "Save Release"}
            </E4Button>
          </div>
        </form>
      </E4Card>

      {/* -----------------------------------------
         TRACKS SECTION (FULL TWO-COLUMN)
      ----------------------------------------- */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT COLUMN — TRACK LIST */}
        <div style={{ flex: "2 1 320px" }}>
          <h2 style={{ marginBottom: 8 }}>
            Tracks {tracks.length > 0 ? `(${tracks.length})` : ""}
          </h2>

          {tracks.length === 0 && (
            <p style={{ marginBottom: 12 }}>No tracks yet for this release.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tracks.map((track) => {
              const isEditing = editingTrackId === track.track_id;

              return (
                <E4Card key={track.track_id}>
                  {!isEditing ? (
                    <>
                      {/* DISPLAY MODE */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <p style={{ margin: "4px 0", fontSize: 16 }}>
                          <strong>
                            {track.track_number != null
                              ? `${track.track_number}. `
                              : ""}
                          </strong>
                          {track.title || "(Untitled Track)"}
                        </p>

                        <div style={{ display: "flex", gap: 8 }}>
                          <E4Button
                            variant="outline"
                            type="button"
                            onClick={() => startEditTrack(track)}
                          >
                            Edit
                          </E4Button>
                          <E4Button
                            variant="ghost"
                            type="button"
                            onClick={() =>
                              handleDeleteTrack(track.track_id)
                            }
                          >
                            Delete
                          </E4Button>
                        </div>
                      </div>

                      {/* AUDIO PLAYER */}
                      {track.audio_url && (
                        <div style={{ marginTop: 4 }}>
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

                      {!track.audio_url && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: 12,
                            color: "#999",
                          }}
                        >
                          No audio file attached yet.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {/* EDIT MODE */}
                      <form
                        onSubmit={handleSaveTrackEdit}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: 14,
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Track Title *
                          </label>
                          <E4Input
                            value={editTitle}
                            onChange={(e) =>
                              setEditTitle(e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              fontSize: 14,
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Track Number (optional)
                          </label>
                          <E4Input
                            value={editTrackNumber}
                            onChange={(e) =>
                              setEditTrackNumber(e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              fontSize: 14,
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Audio URL (optional)
                          </label>
                          <E4Input
                            value={editAudioUrl}
                            onChange={(e) =>
                              setEditAudioUrl(e.target.value)
                            }
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 8,
                            justifyContent: "flex-end",
                          }}
                        >
                          <E4Button
                            type="button"
                            variant="ghost"
                            onClick={cancelEditTrack}
                            disabled={savingEdit}
                          >
                            Cancel
                          </E4Button>
                          <E4Button
                            type="submit"
                            variant="gold"
                            disabled={savingEdit}
                          >
                            {savingEdit ? "Saving…" : "Save"}
                          </E4Button>
                        </div>
                      </form>
                    </>
                  )}
                </E4Card>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN — ADD TRACK */}
        <div style={{ flex: "1 1 280px" }}>
          <h3 style={{ marginBottom: 8 }}>Add New Track</h3>

          <E4Card>
            <form
              onSubmit={handleAddTrack}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div>
                <label
                  style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                >
                  Track Title *
                </label>
                <E4Input
                  value={trackTitle}
                  placeholder="e.g. Intro"
                  onChange={(e) => setTrackTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                >
                  Track Number (optional)
                </label>
                <E4Input
                  value={trackNumber}
                  placeholder="e.g. 1"
                  onChange={(e) => setTrackNumber(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                >
                  Audio File (optional)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
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
              </div>

              <div>
                <label
                  style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                >
                  Audio URL (optional)
                </label>
                <E4Input
                  value={audioUrl}
                  placeholder="Paste an audio URL or leave blank"
                  onChange={(e) => setAudioUrl(e.target.value)}
                />
              </div>

              <E4Button type="submit" variant="gold" disabled={savingTrack}>
                {savingTrack ? "Saving…" : "Add Track"}
              </E4Button>
            </form>
          </E4Card>
        </div>
      </div>
    </div>
  );
}
