import { NextResponse } from "next/server";
import { UserAuthService } from "@/server/services/user-auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, phoneNumber, code, password } = body;

    if (action === "send_code") {
      if (!userId || !phoneNumber) {
        return NextResponse.json({ error: "Missing userId or phoneNumber" }, { status: 400 });
      }
      const res = await UserAuthService.sendAuthCode(userId, phoneNumber);
      return NextResponse.json({ success: true, phoneCodeHash: res.phoneCodeHash });
    }

    if (action === "verify_code") {
      if (!userId || !code) {
        return NextResponse.json({ error: "Missing userId or code" }, { status: 400 });
      }
      const res = await UserAuthService.verifyCodeAndSignIn(userId, code, password);
      return NextResponse.json({ success: true, sessionName: res.sessionName });
    }

    if (action === "disconnect") {
      if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
      }
      await UserAuthService.disconnectUserSession(userId);
      return NextResponse.json({ success: true, message: "Session disconnected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication error" }, { status: 400 });
  }
}
