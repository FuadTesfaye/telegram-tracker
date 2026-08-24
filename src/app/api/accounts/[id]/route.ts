import { NextResponse } from "next/server";
import { AccountRepository } from "@/server/repositories/account.repository";
import { AccountService } from "@/server/services/account.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await AccountRepository.findById(id);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ account });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "stop") {
      const updated = await AccountService.stopTracking(id);
      return NextResponse.json({ success: true, account: updated });
    }

    if (body.action === "resume") {
      const updated = await AccountService.resumeTracking(id);
      return NextResponse.json({ success: true, account: updated });
    }

    const updated = await AccountRepository.updateMetadata(id, {
      label: body.label,
      notes: body.notes,
      displayName: body.displayName,
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await AccountService.deleteAccount(id);
    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
