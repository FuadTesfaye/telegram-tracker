import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyTelegramInitData } from "@/server/auth/telegram-auth";
import { UserRepository } from "@/server/repositories/user.repository";

const requestSchema = z.object({
  initData: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const initDataStr = parsed.data.initData;
    let validated = initDataStr ? verifyTelegramInitData(initDataStr) : null;

    // If running in development and no initData is provided, provide a demo user for seamless local inspection
    if (!validated && process.env.NODE_ENV === "development") {
      validated = {
        user: {
          id: 123456789,
          first_name: "Demo",
          last_name: "User",
          username: "demouser",
          language_code: "en",
        },
        authDate: Math.floor(Date.now() / 1000),
      };
    }

    if (!validated) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid Telegram WebApp initData signature" },
        { status: 401 }
      );
    }

    // Find or create the user in database
    const dbUser = await UserRepository.findOrCreate({
      telegramId: validated.user.id,
      username: validated.user.username,
      firstName: validated.user.first_name,
      lastName: validated.user.last_name,
      languageCode: validated.user.language_code,
    });

    const settings = await UserRepository.getUserSettings(dbUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        telegramId: dbUser.telegramId,
        username: dbUser.username,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        plan: dbUser.plan,
        timezone: settings?.timezone || dbUser.timezone,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
