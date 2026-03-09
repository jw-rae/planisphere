/**
 * stereographic.ts
 * Zenith-centred stereographic projection for the planisphere.
 *
 * Transformation pipeline (PDD §7):
 *   RA/Dec (ICRS)
 *   → rotate by Local Sidereal Time  (places LST meridian at center)
 *   → rotate by Latitude             (tilts sphere so zenith = center)
 *   → reflectX                       (flips East/West for sky-up view)
 *   → d3 geoStereographic
 *   → clip at 90° angular distance from zenith (= horizon)
 *   → SVG pixel coordinates
 *
 * Scale derivation:
 *   For stereographic: r = 2 * scale * tan(θ/2)
 *   At horizon (θ = 90°): r = 2 * scale * tan(45°) = 2 * scale
 *   So scale = radiusPx / 2 puts the horizon exactly at radiusPx.
 */

import * as d3geo from 'd3-geo';
import type { GeoProjection } from 'd3-geo';

export interface ProjectionConfig {
    /** Observer latitude in decimal degrees (+N) */
    latitude: number;
    /** Local Sidereal Time in decimal hours (0–24) */
    lst: number;
    /** Horizon circle radius in SVG pixels */
    radiusPx: number;
    /** SVG center x in pixels — sets the translate origin */
    cx: number;
    /** SVG center y in pixels — sets the translate origin */
    cy: number;
}

/**
 * Build a d3 stereographic projection centred on the observer's zenith.
 *
 * Orientation (planisphere / sky-up convention):
 *   - Zenith maps to (cx, cy)
 *   - North celestial pole is above center (−y direction in SVG)
 *   - East is to the LEFT  (reflectX flips the standard cartographic convention)
 *   - West is to the RIGHT
 *   - Horizon circle has SVG radius = radiusPx
 */
export function buildZenithProjection(config: ProjectionConfig): GeoProjection {
    const { latitude, lst, radiusPx, cx, cy } = config;

    // LST in degrees drives the RA rotation — centers the projection on the meridian
    const lstDeg = lst * 15;

    return (d3geo.geoStereographic() as GeoProjection)
        // Rotate so the zenith (RA=LST, Dec=lat) sits at the projection center
        .rotate([-lstDeg, -latitude, 0])
        // Clip everything below the horizon (>90° from zenith)
        .clipAngle(90)
        // scale = radiusPx/2 → horizon maps to radiusPx from center
        .scale(radiusPx / 2)
        // reflectX: East appears LEFT on screen (correct for looking up at the sky)
        .reflectX(true)
        // Place the zenith at the SVG center
        .translate([cx, cy]);
}

/**
 * Project a single [RA, Dec] coordinate to SVG [x, y].
 * Returns null if the point is below the horizon (clipped by the projection).
 */
export function projectPoint(
    projection: GeoProjection,
    ra: number,
    dec: number,
): [number, number] | null {
    return projection([ra, dec]) ?? null;
}
