/**
 * sidereal.ts
 * Compute Greenwich Mean Sidereal Time (GMST) and Local Sidereal Time (LST).
 * Implemented fully in Step 3.
 *
 * Formula reference: Meeus, "Astronomical Algorithms", Ch. 12
 */

import { toJulianDate } from './julian';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Greenwich Mean Sidereal Time in decimal hours (0–24).
 * @param jd — Julian Date
 */
export function gmstFromJD(jd: number): number {
    // Julian centuries from J2000.0
    const T = (jd - 2_451_545.0) / 36_525;

    // GMST at 0h UT in seconds of time (IAU 1982)
    let gmst =
        24110.54841 +
        8640184.812866 * T +
        0.093104 * T * T -
        6.2e-6 * T * T * T;

    // UT fraction of day in seconds
    const dayFrac = (jd - Math.floor(jd + 0.5) + 0.5) * 86_400;
    gmst = gmst + 1.00273790935 * dayFrac;

    // Convert seconds → hours, wrap to [0, 24)
    let hours = (gmst / 3600) % 24;
    if (hours < 0) hours += 24;
    return hours;
}

/**
 * Local Sidereal Time in decimal hours (0–24).
 * @param date      — observation date/time
 * @param longitude — observer longitude in decimal degrees (+E / −W)
 */
export function localSiderealTime(date: Date, longitude: number): number {
    const jd = toJulianDate(date);
    let lst = (gmstFromJD(jd) + longitude / 15) % 24;
    if (lst < 0) lst += 24;
    return lst;
}

/**
 * Local Sidereal Time in decimal hours, given a pre-computed JD and longitude.
 */
export function lstFromJD(jd: number, longitude: number): number {
    let lst = (gmstFromJD(jd) + longitude / 15) % 24;
    if (lst < 0) lst += 24;
    return lst;
}

/** Convert decimal hours → degrees */
export function hoursToDeg(hours: number): number {
    return hours * 15;
}

/** Convert degrees → radians */
export function toRad(deg: number): number {
    return deg * DEG_TO_RAD;
}

/** Convert radians → degrees */
export function toDeg(rad: number): number {
    return rad * RAD_TO_DEG;
}
