import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();

  const audio = formData.get("audio") as File | null;
  const cover = formData.get("cover") as File | null;

  // Save folder (inside .next for now — temporary testing only)
  const uploadDir = path.join(process.cwd(), "uploads");

  try {
    if (audio) {
      const bytes = Buffer.from(await audio.arrayBuffer());
      const filePath = path.join(uploadDir, `audio-${Date.now()}-${audio.name}`);
      await writeFile(filePath, bytes);
    }

    if (cover) {
      const bytes = Buffer.from(await cover.arrayBuffer());
      const filePath = path.join(uploadDir, `cover-${Date.now()}-${cover.name}`);
      await writeFile(filePath, bytes);
    }

    return NextResponse.json({ message: "Upload successful" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
