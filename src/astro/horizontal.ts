/**
 * horizontal.ts
 * Horizon filtering helpers.
 * Determines which stars or points are above the observer's horizon.
 * Implemented fully in Step 3.
 */

import { type HorizontalCoord } from './coordinates';

/**
 * Returns true if the coordinate is above the mathematical horizon (alt ≥ 0°).
 * @param coord — { az, alt } in decimal degrees
 */
export function isAboveHorizon(coord: HorizontalCoord): boolean {
    return coord.alt >= 0;
}

/**
 * Filter an array of items to only those above the horizon.
 * @param items    — array of items with a `coord` property
 * @param getCoord — accessor returning the HorizontalCoord for each item
 */
export function filterAboveHorizon<T>(
    items: T[],
    getCoord: (item: T) => HorizontalCoord,
): T[] {
    return items.filter((item) => isAboveHorizon(getCoord(item)));
}

/**
 * Clamp altitude to [0, 90] for projection safety.
 */
export function clampAltitude(alt: number): number {
    return Math.max(0, Math.min(90, alt));
}
