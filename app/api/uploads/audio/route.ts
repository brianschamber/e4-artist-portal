import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  try {
    // ✅ Parse multipart/form-data automatically
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No audio file found in upload." },
        { status: 400 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const originalName = file.name || "audio";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop()
      : "wav";

    const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("Audio upload error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to upload audio file." },
      { status: 500 }
    );
  }
}
