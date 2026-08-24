import { NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/analytics.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const daysBack = parseInt(searchParams.get("daysBack") || "30", 10);
    const timezone = searchParams.get("timezone") || "UTC";

    const hourly = await AnalyticsService.getHourlyHeatmap(
      id,
      daysBack,
      timezone
    );

    return NextResponse.json({ hourly });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
