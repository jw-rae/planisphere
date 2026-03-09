/**
 * constellationLabelLayer.ts
 * Renders constellation name labels onto the sky SVG.
 *
 * Labels are placed at the GeoJSON centroid coordinates from constellations.json.
 * They are split into three tier groups by rank so mapZoom can progressively
 * reveal more labels as the user zooms in — identical pattern to star label tiers.
 *
 * Tier 0: rank 1 (major constellations — Orion, Ursa Major, etc.) — always shown
 * Tier 1: rank 2 (medium)  — visible at zoom ≥ 1.5×
 * Tier 2: rank 3 (minor)   — visible at zoom ≥ 3×
 */

import type { GeoProjection } from 'd3-geo';
import type { ConstellationLabel } from '../data/loader';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Zoom thresholds that mirror LABEL_TIERS for star names */
export const CONST_LABEL_TIERS: { maxRank: number; minZoom: number }[] = [
    { maxRank: 1, minZoom: 0 },
    { maxRank: 2, minZoom: 1.5 },
    { maxRank: 3, minZoom: 3.0 },
];

export function renderConstellationLabelLayer(
    layer: SVGGElement,
    labels: ConstellationLabel[],
    projection: GeoProjection,
): void {
    layer.replaceChildren();

    // One <g> per tier — mapZoom toggles visibility by adding/removing a class
    const tierGroups = CONST_LABEL_TIERS.map((_, i) => {
        const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
        g.setAttribute('data-const-tier', String(i));
        if (i > 0) g.classList.add('const-label-tier--hidden');
        layer.appendChild(g);
        return g;
    });

    for (const label of labels) {
        const pt = projection([label.ra, label.dec]);
        if (!pt) continue;

        const [x, y] = pt;

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', x.toFixed(2));
        text.setAttribute('y', y.toFixed(2));
        text.setAttribute('class', 'const-label');
        text.setAttribute('data-rank', String(label.rank));
        text.textContent = label.name;

        // Rank 1 → tier 0 group, Rank 2 → tier 1, Rank 3 → tier 2
        const tierIndex = label.rank - 1;
        const group = tierGroups[Math.min(tierIndex, tierGroups.length - 1)];
        group.appendChild(text);
    }
}
