import "dotenv/config";

const BASE_URL = "https://telegram-tracker-alpha.vercel.app";
const TEST_USER_ID = "0de130c1-ee4c-4c32-9366-353e207e6446";

interface TestResult {
  name: string;
  url: string;
  status: number;
  ok: boolean;
  details?: any;
}

async function runTests() {
  console.log(`🚀 Starting Comprehensive Verification on ${BASE_URL}...\n`);
  const results: TestResult[] = [];

  // 1. Health check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    results.push({
      name: "API Health Check",
      url: "/api/health",
      status: res.status,
      ok: res.ok && data.status === "ok",
      details: data,
    });
  } catch (e: any) {
    results.push({ name: "API Health Check", url: "/api/health", status: 500, ok: false, details: e.message });
  }

  // 2. Mini App Pages (HTML 200 checks)
  const pages = [
    { name: "Mini App Home / Dashboard", path: "/" },
    { name: "Mini App League Leaderboard", path: "/league" },
    { name: "Mini App Roast & Fun Hub", path: "/fun" },
    { name: "Mini App Competitors Slots", path: "/accounts" },
    { name: "Mini App Deep Analytics", path: "/analytics" },
    { name: "Mini App Footprint / Profile", path: "/my" },
    { name: "Mini App Head-to-Head Compare", path: "/compare" },
    { name: "Mini App Session History", path: "/history" },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`);
      results.push({
        name: page.name,
        url: page.path,
        status: res.status,
        ok: res.status === 200,
      });
    } catch (e: any) {
      results.push({ name: page.name, url: page.path, status: 500, ok: false, details: e.message });
    }
  }

  // 3. League API Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/league?userId=${TEST_USER_ID}`);
    const data = await res.json();
    results.push({
      name: "Weekly League API (Triumvirate, Ranks, Awards, Roast of the Week)",
      url: `/api/league?userId=${TEST_USER_ID}`,
      status: res.status,
      ok: res.ok && Boolean(data.triumvirateTitle) && Array.isArray(data.competitors),
      details: {
        weekNumber: data.weekNumber,
        triumvirateTitle: data.triumvirateTitle,
        roastOfTheWeek: data.roastOfTheWeek?.slice(0, 60) + "...",
        competitorsCount: data.competitors?.length,
        awardsCount: data.awards?.length,
      },
    });
  } catch (e: any) {
    results.push({ name: "Weekly League API", url: "/api/league", status: 500, ok: false, details: e.message });
  }

  // 4. Rival Showdown API
  try {
    const res = await fetch(`${BASE_URL}/api/league/rival?userId=${TEST_USER_ID}`);
    const data = await res.json();
    results.push({
      name: "Rival Head-to-Head API",
      url: `/api/league/rival?userId=${TEST_USER_ID}`,
      status: res.status,
      ok: res.ok && Boolean(data.rival?.statusMessage),
      details: {
        user: data.rival?.userAccount?.displayName,
        rival: data.rival?.rivalAccount?.displayName,
        gap: data.rival?.formattedGap,
        status: data.rival?.statusMessage,
      },
    });
  } catch (e: any) {
    results.push({ name: "Rival API", url: "/api/league/rival", status: 500, ok: false, details: e.message });
  }

  // 5. Multi-Level Roast API
  const levels = ["friendly", "normal", "brutal", "nuclear"];
  for (const level of levels) {
    try {
      const res = await fetch(`${BASE_URL}/api/league/roast?userId=${TEST_USER_ID}&level=${level}`);
      const data = await res.json();
      results.push({
        name: `Roast Engine API [${level.toUpperCase()}]`,
        url: `/api/league/roast?level=${level}`,
        status: res.status,
        ok: res.ok && Boolean(data.title) && Boolean(data.roastText),
        details: {
          title: data.title,
          roast: data.roastText?.slice(0, 70) + "...",
          verdict: data.verdict,
        },
      });
    } catch (e: any) {
      results.push({ name: `Roast API [${level}]`, url: "/api/league/roast", status: 500, ok: false, details: e.message });
    }
  }

  // 6. Telegram Bot Webhook Simulation (/start)
  try {
    const fakeUpdate = {
      update_id: 999999,
      message: {
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 5599179694, type: "private", first_name: "Fuad" },
        from: { id: 5599179694, is_bot: false, first_name: "Fuad", username: "fuadtesfaye" },
        text: "/start",
      },
    };

    const res = await fetch(`${BASE_URL}/api/bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fakeUpdate),
    });

    results.push({
      name: "Telegram Bot Webhook Handler (/start)",
      url: "/api/bot",
      status: res.status,
      ok: res.status === 200,
    });
  } catch (e: any) {
    results.push({ name: "Telegram Bot Webhook", url: "/api/bot", status: 500, ok: false, details: e.message });
  }

  // 7. League Bets & Odds API
  try {
    const res = await fetch(`${BASE_URL}/api/league/bets?userId=${TEST_USER_ID}`);
    const data = await res.json();
    results.push({
      name: "League Bets & Multipliers API",
      url: `/api/league/bets?userId=${TEST_USER_ID}`,
      status: res.status,
      ok: res.ok && Array.isArray(data.odds),
      details: {
        weekNumber: data.weekNumber,
        userPoints: data.userPoints,
        oddsCount: data.odds?.length,
        favorite: data.odds?.[0] ? `${data.odds[0].displayName} (${data.odds[0].odds}x)` : "None",
      },
    });
  } catch (e: any) {
    results.push({ name: "League Bets API", url: "/api/league/bets", status: 500, ok: false, details: e.message });
  }

  // Print Summary Table
  console.log("═══════════════════════════════════════════════════════════════════════════");
  console.log("                      LIVE TEST RESULTS REPORT                             ");
  console.log("═══════════════════════════════════════════════════════════════════════════");

  let allPassed = true;
  for (const r of results) {
    const icon = r.ok ? "✅ PASS" : "❌ FAIL";
    if (!r.ok) allPassed = false;
    console.log(`${icon} [HTTP ${r.status}] ${r.name}`);
    if (r.details) {
      console.log(`   └─ Details:`, JSON.stringify(r.details));
    }
  }

  console.log("═══════════════════════════════════════════════════════════════════════════");
  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED! Mini App and Bot are 100% operational on Vercel.");
  } else {
    console.log("⚠️ Some tests failed. Check logs above.");
  }
}

runTests();
