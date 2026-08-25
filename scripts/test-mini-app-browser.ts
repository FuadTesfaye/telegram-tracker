import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const BASE_URL = "https://telegram-tracker-alpha.vercel.app";
const ARTIFACTS_DIR = "/home/fuaf24/.gemini/antigravity-cli/brain/dfc78100-5b67-4465-9020-ad25a39f7e1a";
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testTelegramMiniApp() {
  console.log("🚀 Launching Chrome to test Telegram Mini App on Vercel...\n");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Telegram/10.9 (iPhone; iOS 17.4; Scale/3.00)",
  });

  // Inject Telegram WebApp object before page scripts run
  await context.addInitScript(() => {
    (window as any).Telegram = {
      WebApp: {
        initData: "user=%7B%22id%22%3A5599179694%2C%22first_name%22%3A%22Fuad%22%2C%22last_name%22%3A%22Tesfaye%22%2C%22username%22%3A%22fuadtesfaye%22%7D",
        initDataUnsafe: {
          user: {
            id: 5599179694,
            first_name: "Fuad",
            last_name: "Tesfaye",
            username: "fuadtesfaye",
            language_code: "en",
          },
        },
        version: "7.0",
        platform: "ios",
        colorScheme: "dark",
        themeParams: {
          bg_color: "#090a0f",
          text_color: "#f4f4f5",
          hint_color: "#71717a",
          link_color: "#0ea5e9",
          button_color: "#0284c7",
          button_text_color: "#ffffff",
          secondary_bg_color: "#11151f",
        },
        isExpanded: true,
        viewportHeight: 844,
        viewportStableHeight: 844,
        headerColor: "#090a0f",
        backgroundColor: "#090a0f",
        ready: () => {},
        expand: () => {},
        close: () => {},
        HapticFeedback: {
          impactOccurred: (style: string) => {
            console.log("[Haptic]", style);
          },
          notificationOccurred: (type: string) => {
            console.log("[Haptic Notification]", type);
          },
          selectionChanged: () => {
            console.log("[Haptic Selection]");
          },
        },
      },
    };
  });

  const page = await context.newPage();

  // Test 1: Home Dashboard
  console.log("1️⃣ Testing Home Dashboard...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const homePath = path.join(SCREENSHOT_DIR, "01_home_dashboard.png");
  await page.screenshot({ path: homePath });
  console.log(`   📸 Saved screenshot: ${homePath}`);

  // Test 2: League Leaderboard & Wagers
  console.log("2️⃣ Testing League Ranks & Wagers...");
  await page.goto(`${BASE_URL}/league`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const leaguePath = path.join(SCREENSHOT_DIR, "02_league_leaderboard.png");
  await page.screenshot({ path: leaguePath });
  console.log(`   📸 Saved screenshot: ${leaguePath}`);

  // Switch to Bets Tab
  console.log("   👉 Switching to Bets Tab...");
  const betsTabButton = page.locator("button:has-text('🎲 Bets')");
  if (await betsTabButton.count() > 0) {
    await betsTabButton.click();
    await page.waitForTimeout(1000);
    const betsPath = path.join(SCREENSHOT_DIR, "03_league_bets_tab.png");
    await page.screenshot({ path: betsPath });
    console.log(`   📸 Saved screenshot: ${betsPath}`);

    // Place Bet interaction
    const betButton = page.locator("button:has-text('Bet')").first();
    if (await betButton.count() > 0) {
      console.log("   👉 Clicking Place Bet on favorite...");
      await betButton.click();
      await page.waitForTimeout(1000);
      const lockedBetPath = path.join(SCREENSHOT_DIR, "04_locked_wager_slip.png");
      await page.screenshot({ path: lockedBetPath });
      console.log(`   📸 Saved screenshot: ${lockedBetPath}`);
    }
  }

  // Test 3: Roast Hub
  console.log("3️⃣ Testing Roast Hub...");
  await page.goto(`${BASE_URL}/fun`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const roastPath = path.join(SCREENSHOT_DIR, "05_roast_hub.png");
  await page.screenshot({ path: roastPath });
  console.log(`   📸 Saved screenshot: ${roastPath}`);

  // Test 4: Competitor Slots
  console.log("4️⃣ Testing Competitor Slots...");
  await page.goto(`${BASE_URL}/accounts`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const slotsPath = path.join(SCREENSHOT_DIR, "06_slots.png");
  await page.screenshot({ path: slotsPath });
  console.log(`   📸 Saved screenshot: ${slotsPath}`);

  // Test 5: Footprint / My Profile
  console.log("5️⃣ Testing Footprint / Profile...");
  await page.goto(`${BASE_URL}/my`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const footprintPath = path.join(SCREENSHOT_DIR, "07_footprint.png");
  await page.screenshot({ path: footprintPath });
  console.log(`   📸 Saved screenshot: ${footprintPath}`);

  // Test 6: Head-to-Head Compare
  console.log("6️⃣ Testing Compare...");
  await page.goto(`${BASE_URL}/compare`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const comparePath = path.join(SCREENSHOT_DIR, "08_compare.png");
  await page.screenshot({ path: comparePath });
  console.log(`   📸 Saved screenshot: ${comparePath}`);

  await browser.close();
  console.log("\n🎉 ALL TELEGRAM MINI APP IN-BROWSER TESTS COMPLETED SUCCESSFULLY!");
}

testTelegramMiniApp().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
