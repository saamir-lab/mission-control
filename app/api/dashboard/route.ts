import { NextResponse } from "next/server";
import { getDashboardData, getPersonDetailData } from "@/src/lib/linear";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");

    // If personId is provided, return person detail data
    if (personId) {
      const personData = await getPersonDetailData(personId);
      if (!personData) {
        return NextResponse.json(
          { error: "Person not found." },
          { status: 404 },
        );
      }
      return NextResponse.json(personData, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Otherwise return full dashboard data
    const data = await getDashboardData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Dashboard API failed:", error);
    
    // Return a more detailed error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { 
        error: "Unable to load dashboard data",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
