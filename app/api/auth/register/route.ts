import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    { error: "Email routes are temporarily disabled for deployment." },
    { status: 501 }
  );
}
