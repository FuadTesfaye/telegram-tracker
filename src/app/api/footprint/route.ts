import { NextResponse } from "next/server";
import { FootprintService } from "@/server/services/footprint.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const footprint = await FootprintService.getUserFootprint(userId);
    return NextResponse.json({ success: true, footprint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, customLabel } = body;

    if (!chatId || !customLabel) {
      return NextResponse.json({ error: "Missing chatId or customLabel" }, { status: 400 });
    }

    const updated = await FootprintService.updateChatLabel(chatId, customLabel);
    return NextResponse.json({ success: true, chat: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
