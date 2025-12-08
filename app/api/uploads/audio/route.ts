// app/api/uploads/audio/route.ts
export const runtime = "nodejs"; // IMPORTANT so we can use fs

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // Read the multipart/form-data from the client
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error("No file uploaded", 400);
    }

    // Original filename + extension
    const originalName = file.name || "audio";
    const ext = path.extname(originalName) || ".mp3";

    // Make a safe base name (no spaces)
    const safeBaseName = path
      .basename(originalName, ext)
      .replace(/\s+/g, "_")
      .toLowerCase();

    // Unique filename so we don't overwrite things
    const fileName = `${Date.now()}-${safeBaseName}${ext}`;

    // Destination: /public/audio/<fileName>
    const audioDir = path.join(process.cwd(), "public", "audio");
    await fs.mkdir(audioDir, { recursive: true });

    const filePath = path.join(audioDir, fileName);

    // Convert the File into a Node Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write to disk
    await fs.writeFile(filePath, buffer);

    // Public URL your <audio> tag can use
    const publicUrl = `/audio/${fileName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      fileName,
    });
  } catch (err) {
    console.error("Error uploading audio:", err);
    return error("Failed to upload audio file", 500);
  }
}
