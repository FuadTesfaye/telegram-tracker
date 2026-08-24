import { NextResponse } from "next/server";
import { ExportService } from "@/server/services/export.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    if (format === "json") {
      const data = await ExportService.exportJsonBundle(id);
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="telemetr_export_${id}.json"`,
        },
      });
    }

    const csvData = await ExportService.exportDailyCsv(id);
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="telemetr_export_${id}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
