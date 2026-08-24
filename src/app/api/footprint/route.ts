import { NextResponse } from "next/server";
import { FootprintService } from "@/server/services/footprint.service";
import { handleApiError, AppError } from "@/lib/error-handler";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      throw new AppError("Missing required user session identifier", 400, "UNAUTHORIZED");
    }

    const footprint = await FootprintService.getUserFootprint(userId);
    return NextResponse.json(
      { success: true, footprint },
      {
        headers: {
          "Cache-Control": "public, max-age=10, s-maxage=20, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, customLabel } = body;

    if (!chatId || !customLabel) {
      throw new AppError("Please provide both a chat identifier and label", 400, "VALIDATION_ERROR");
    }

    const updated = await FootprintService.updateChatLabel(chatId, customLabel);
    return NextResponse.json({ success: true, chat: updated });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
