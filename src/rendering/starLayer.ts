/**
 * starLayer.ts
 * Render star points as SVG <circle> elements, scaled by magnitude.
 * Named bright stars also get a <text> label in the label layer.
 */

import type { GeoProjection } from 'd3-geo';
import type { Star } from '../data/loader';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Map apparent magnitude to SVG circle radius (in SVG user-units at zoom 1×).
 * Tuned to be compact with a gentle spread — big stars noticeable but not
 * overwhelming; faint stars still clearly visible dots.
 *   Sirius (−1.5)  → ~2.5 px
 *   Vega   ( 0.0)  → ~2.0 px
 *   mag 2          → ~1.3 px
 *   mag 4.5        → ~0.6 px (floor)
 */
export function magToRadius(mag: number): number {
    return Math.max(0.6, 2.0 - mag * 0.35);
}

/**
 * Map B−V colour index to an approximate stellar colour.
 *   B−V < 0    → blue-white  (O / B stars)
 *   B−V 0–0.6  → white       (A / F stars)
 *   B−V 0.6–1  → yellow      (G stars — Sun is ~0.65)
 *   B−V 1–1.5  → orange      (K stars)
 *   B−V > 1.5  → red-orange  (M stars)
 */
function bvToColor(bv: number): string {
    if (bv < -0.3) return '#9bb0ff';
    if (bv < 0.0) return '#aabfff';
    if (bv < 0.3) return '#cad7ff';
    if (bv < 0.6) return '#f8f7ff';
    if (bv < 1.0) return '#fff4ea';
    if (bv < 1.4) return '#ffd2a1';
    return '#ffad51';
}

/**
 * Render all visible stars into `starLayer` and their labels into `labelLayer`.
 *
 * @param starLayer   — <g id="layer-stars">
 * @param labelLayer  — <g id="layer-labels">
 * @param stars       — full star catalogue (projection filters below-horizon)
 * @param projection  — configured zenith sterographic projection
 * @param showLabels  — whether to render proper-name labels
 * @param radiusPx    — horizon circle radius (used to skip points outside disk)
 */
/**
 * Label magnitude thresholds per zoom tier.
 * Tier 0: always shown  → mag ≤ 2.5  (brightest named stars)
 * Tier 1: zoom ≥ 2.5×  → mag ≤ 3.5
 * Tier 2: zoom ≥ 5×    → mag ≤ 5.0
 */
export const LABEL_TIERS: { maxMag: number; minZoom: number }[] = [
    { maxMag: 2.5, minZoom: 0 },
    { maxMag: 3.5, minZoom: 2.5 },
    { maxMag: 5.0, minZoom: 5.0 },
];

export function renderStarLayer(
    starLayer: SVGGElement,
    labelLayer: SVGGElement,
    stars: Star[],
    projection: GeoProjection,
    showLabels: boolean,
    radiusPx: number,
): void {
    starLayer.replaceChildren();
    labelLayer.replaceChildren();

    const [cx, cy] = projection.translate();
    const r2 = radiusPx * radiusPx;
    const finiteRadius = isFinite(radiusPx);

    // Create one <g> per label tier so mapZoom can toggle them independently
    const tierGroups = LABEL_TIERS.map((tier, i) => {
        const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
        g.setAttribute('data-label-tier', String(i));
        if (i > 0) g.classList.add('label-tier--hidden');
        labelLayer.appendChild(g);
        return g;
    });

    for (const star of stars) {
        const pt = projection([star.ra, star.dec]);
        if (!pt) continue;

        const [x, y] = pt;

        // In planisphere mode, skip points outside the horizon circle
        if (finiteRadius) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy > r2 * 1.01) continue;
        }

        // Star dot — radius stored as CSS custom property so CSS can
        // counter-scale it with --zoom-k without re-rendering
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', x.toFixed(2));
        circle.setAttribute('cy', y.toFixed(2));
        circle.style.setProperty('--star-r', `${magToRadius(star.mag).toFixed(2)}px`);
        circle.setAttribute('fill', bvToColor(star.bv));
        starLayer.appendChild(circle);

        // Labels: place in the appropriate tier group
        if (showLabels && star.name) {
            for (let t = LABEL_TIERS.length - 1; t >= 0; t--) {
                if (star.mag <= LABEL_TIERS[t].maxMag) {
                    const offset = magToRadius(star.mag) + 3;
                    const text = document.createElementNS(SVG_NS, 'text');
                    text.setAttribute('x', (x + offset).toFixed(2));
                    text.setAttribute('y', (y + 3).toFixed(2));
                    text.setAttribute('class', 'star-label');
                    text.textContent = star.name;
                    tierGroups[t].appendChild(text);
                    break;
                }
            }
        }
    }
}
