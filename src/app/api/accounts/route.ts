import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountRepository } from "@/server/repositories/account.repository";
import { AccountService } from "@/server/services/account.service";
import { handleApiError } from "@/lib/error-handler";

const createAccountSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().min(2),
  label: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      const all = await AccountRepository.listAllActive();
      return NextResponse.json({ accounts: all });
    }

    const accounts = await AccountRepository.listByOwner(userId);
    return NextResponse.json({ accounts });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createAccountSchema.parse(body);

    const { userId, username, label, notes } = parsed;
    const created = await AccountService.addAccountToTrack(
      userId,
      username,
      label,
      notes
    );

    return NextResponse.json({ success: true, account: created });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
