export interface SessionSplitSlice {
  dateStr: string; // YYYY-MM-DD
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  hourDistribution: Array<{ hour: number; seconds: number }>;
}

/**
 * Splits a session that spans midnight into discrete calendar-day slices with exact hourly distributions
 */
export function splitSessionByMidnight(
  startedAt: Date,
  endedAt: Date
): SessionSplitSlice[] {
  const slices: SessionSplitSlice[] = [];
  let currentStart = new Date(startedAt);
  const finalEnd = new Date(endedAt);

  if (finalEnd.getTime() <= currentStart.getTime()) {
    return [];
  }

  while (currentStart.getTime() < finalEnd.getTime()) {
    // Determine end of the current calendar day (in UTC)
    const endOfDay = new Date(Date.UTC(
      currentStart.getUTCFullYear(),
      currentStart.getUTCMonth(),
      currentStart.getUTCDate(),
      23,
      59,
      59,
      999
    ));

    const sliceEnd = finalEnd.getTime() <= endOfDay.getTime() ? finalEnd : endOfDay;
    const durationSeconds = Math.max(
      1,
      Math.round((sliceEnd.getTime() - currentStart.getTime()) / 1000)
    );

    const year = currentStart.getUTCFullYear();
    const month = String(currentStart.getUTCMonth() + 1).padStart(2, "0");
    const day = String(currentStart.getUTCDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Calculate hourly breakdown for this daily slice
    const hourMap = new Map<number, number>();
    let hourIter = new Date(currentStart);

    while (hourIter.getTime() < sliceEnd.getTime()) {
      const currentHour = hourIter.getUTCHours();
      const nextHourStart = new Date(Date.UTC(
        hourIter.getUTCFullYear(),
        hourIter.getUTCMonth(),
        hourIter.getUTCDate(),
        currentHour + 1,
        0,
        0,
        0
      ));

      const hourEnd = sliceEnd.getTime() < nextHourStart.getTime() ? sliceEnd : nextHourStart;
      const secondsInHour = Math.max(
        1,
        Math.round((hourEnd.getTime() - hourIter.getTime()) / 1000)
      );

      hourMap.set(currentHour, (hourMap.get(currentHour) || 0) + secondsInHour);
      hourIter = nextHourStart;
    }

    const hourDistribution: Array<{ hour: number; seconds: number }> = [];
    for (const [hour, seconds] of hourMap.entries()) {
      hourDistribution.push({ hour, seconds });
    }

    slices.push({
      dateStr,
      startedAt: new Date(currentStart),
      endedAt: new Date(sliceEnd),
      durationSeconds,
      hourDistribution,
    });

    // Advance to start of next day (00:00:00.000)
    currentStart = new Date(Date.UTC(
      currentStart.getUTCFullYear(),
      currentStart.getUTCMonth(),
      currentStart.getUTCDate() + 1,
      0,
      0,
      0,
      0
    ));
  }

  return slices;
}
