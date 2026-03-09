/**
 * coordinates.ts
 * Transform equatorial (RA/Dec) coordinates to local horizontal (Az/Alt) coordinates.
 * Implemented fully in Step 3.
 *
 * Pipeline:
 *   RA/Dec (ICRS) → Hour Angle → Altitude / Azimuth
 *
 * Formula reference: Meeus, "Astronomical Algorithms", Ch. 13
 */

import { toRad, toDeg } from './sidereal';

export interface EquatorialCoord {
    /** Right Ascension in decimal degrees (0–360) */
    ra: number;
    /** Declination in decimal degrees (−90 to +90) */
    dec: number;
}

export interface HorizontalCoord {
    /** Azimuth in decimal degrees (0=N, 90=E, 180=S, 270=W) */
    az: number;
    /** Altitude in decimal degrees (0=horizon, +90=zenith) */
    alt: number;
}

/**
 * Convert equatorial RA/Dec to local Altitude/Azimuth.
 *
 * @param ra        — Right Ascension in decimal degrees
 * @param dec       — Declination in decimal degrees
 * @param lst       — Local Sidereal Time in decimal hours
 * @param latitude  — Observer latitude in decimal degrees (+N)
 */
export function equatorialToHorizontal(
    ra: number,
    dec: number,
    lst: number,
    latitude: number,
): HorizontalCoord {
    // Hour Angle in degrees
    const ha = ((lst * 15 - ra) % 360 + 360) % 360;

    const haRad = toRad(ha);
    const decRad = toRad(dec);
    const latRad = toRad(latitude);

    // Altitude
    const sinAlt =
        Math.sin(decRad) * Math.sin(latRad) +
        Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
    const alt = toDeg(Math.asin(sinAlt));

    // Azimuth (measured from South, then converted to N=0)
    const cosAz =
        (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
        (Math.cos(latRad) * Math.cos(toRad(alt)));
    let az = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
    if (Math.sin(haRad) > 0) az = 360 - az;

    return { az, alt };
}

/**
 * Hour Angle from LST and RA.
 * @returns HA in decimal degrees [0, 360)
 */
export function hourAngle(lst: number, ra: number): number {
    return ((lst * 15 - ra) % 360 + 360) % 360;
}
