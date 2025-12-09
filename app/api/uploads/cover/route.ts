// app/api/uploads/cover/route.ts
import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/*",
        ],
        maximumSizeInBytes: 10 * 1024 * 1024,
      }),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Blob cover upload error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate upload token for cover art" },
      { status: 500 }
    );
  }
}
