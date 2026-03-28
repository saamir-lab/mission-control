import { NextResponse } from "next/server";
import { getGraphPayload } from "@/src/lib/mission-control-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = getGraphPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      {
        error: "Unable to load graph payload",
        details: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
