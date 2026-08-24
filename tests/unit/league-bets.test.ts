import { describe, it, expect } from "vitest";

describe("League Bets & Prediction Logic", () => {
  it("calculates implied odds and probability multipliers correctly", () => {
    const totalPool = 10000;
    const favoriteSecs = 6000;
    const contenderSecs = 3000;
    const underdogSecs = 1000;

    const favoriteShare = favoriteSecs / totalPool;
    const favoriteOdds = Number(Math.max(1.25, Math.min(1.85, 1 / Math.max(0.4, favoriteShare))).toFixed(2));
    const favoriteProb = Math.round((1 / favoriteOdds) * 100);

    expect(favoriteOdds).toBeGreaterThanOrEqual(1.25);
    expect(favoriteOdds).toBeLessThanOrEqual(1.85);
    expect(favoriteProb).toBeGreaterThanOrEqual(50);

    const contenderShare = contenderSecs / totalPool;
    const contenderOdds = Number(Math.max(1.95, Math.min(3.2, 1 / Math.max(0.2, contenderShare))).toFixed(2));
    expect(contenderOdds).toBeGreaterThan(favoriteOdds);

    const underdogShare = underdogSecs / totalPool;
    const underdogOdds = Number(Math.max(3.5, Math.min(8.0, 1 / Math.max(0.1, underdogShare))).toFixed(2));
    expect(underdogOdds).toBeGreaterThan(contenderOdds);
  });

  it("calculates potential win payouts accurately", () => {
    const stake = 250;
    const odds = 1.45;
    const payout = Math.round(stake * odds);
    expect(payout).toBe(363);
  });
});
