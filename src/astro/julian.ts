/**
 * julian.ts
 * Convert a JavaScript Date to a Julian Date Number (JDN).
 * Implemented fully in Step 3.
 *
 * Formula reference: Meeus, "Astronomical Algorithms", Ch. 7
 */

/**
 * Returns the Julian Date for a given JS Date object.
 * JD = 2440587.5 + (unix_ms / 86400000)
 */
export function toJulianDate(date: Date): number {
    return date.getTime() / 86_400_000 + 2_440_587.5;
}

/**
 * Returns the Julian Date for a given date at a specific time-of-day.
 * @param date    — calendar date (y/m/d component used)
 * @param minutesFromMidnight — 0–1440 local time offset in minutes
 * @param tzOffsetMinutes     — local timezone offset from UTC in minutes (default 0 = UTC)
 */
export function julianDateAt(
    date: Date,
    minutesFromMidnight: number,
    tzOffsetMinutes: number = 0,
): number {
    const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const totalOffsetMs = (minutesFromMidnight - tzOffsetMinutes) * 60_000;
    const observationMs = utcMidnight + totalOffsetMs;
    return observationMs / 86_400_000 + 2_440_587.5;
}
