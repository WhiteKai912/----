import { getFeaturedPlaylists } from "@/lib/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const playlists = await getFeaturedPlaylists();
    
    // Log the playlist data to see what's being sent
    // console.log("Featured Playlists API response:", JSON.stringify(playlists, null, 2));

    return NextResponse.json({ playlists }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Error fetching featured playlists:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
