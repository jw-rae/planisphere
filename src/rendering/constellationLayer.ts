/**
 * constellationLayer.ts
 * Render constellation line segments from GeoJSON MultiLineString features
 * using d3-geo's path generator — handles clipping and projection natively.
 */

import * as d3geo from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import type { ConstellationLines } from '../data/loader';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Render constellation lines into `layer`.
 *
 * @param layer      — <g id="layer-constellation">
 * @param lines      — d3-celestial constellations.lines GeoJSON FeatureCollection
 * @param projection — configured zenith stereographic projection
 */
export function renderConstellationLayer(
    layer: SVGGElement,
    lines: ConstellationLines,
    projection: GeoProjection,
): void {
    layer.replaceChildren();

    // d3.geoPath uses the projection's built-in clipping — no extra work needed
    const path = d3geo.geoPath(projection);

    for (const feature of lines.features) {
        const d = path(feature);
        if (!d) continue; // feature is entirely below horizon

        const pathEl = document.createElementNS(SVG_NS, 'path');
        pathEl.setAttribute('d', d);
        pathEl.setAttribute('class', 'constellation-line');
        layer.appendChild(pathEl);
    }
}
