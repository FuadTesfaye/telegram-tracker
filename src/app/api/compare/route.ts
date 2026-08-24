import { NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/analytics.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    const timezone = searchParams.get("timezone") || "UTC";

    if (!idsParam) {
      return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
    }

    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const comparisons = await AnalyticsService.compareAccounts(ids, 7, timezone);

    return NextResponse.json({ comparisons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
