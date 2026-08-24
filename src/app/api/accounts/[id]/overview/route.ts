import { NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/analytics.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const timezone = searchParams.get("timezone") || "UTC";

    const overview = await AnalyticsService.getAccountOverview(id, timezone);
    if (!overview) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ overview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
