"use client";

import { useState } from "react";

export default function UploadPage() {
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function handleUpload() {
    if (!audio && !cover) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    if (audio) formData.append("audio", audio);
    if (cover) formData.append("cover", cover);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || "Uploaded!");
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Upload Files</h1>

      <div style={{ marginBottom: 16 }}>
        <label>Audio File (.mp3, .wav)</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setAudio(e.target.files?.[0] || null)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Cover Art (.jpg, .png)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={handleUpload}
        style={{
          padding: "10px 18px",
          background: "#d4af37",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Upload
      </button>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}
