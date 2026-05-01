/**
 * GET /api/stats — Public platform statistics
 * Proxies to Railway Flask backend with fallback to cached/static data
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      "https://portraitpay-api-production.up.railway.app/api/stats",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
      },
    });
  } catch {
    // Fallback: return cached/mocked stats when backend is unavailable
    return Response.json(
      { users: 127, portraits: 248, timestamp: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
        },
      }
    );
  }
}