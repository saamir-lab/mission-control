import { NextResponse } from "next/server";
import { queryLinearRaw } from "@/lib/linear";

type LinearBody = {
  query?: string;
  variables?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LinearBody;

    if (!body?.query || typeof body.query !== "string") {
      return NextResponse.json({ error: "GraphQL query is required." }, { status: 400 });
    }

    const data = await queryLinearRaw(body.query, body.variables);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
