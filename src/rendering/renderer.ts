/**
 * renderer.ts
 * Main SVG rendering orchestrator.
 * Converts sky state → LST → projection → draws all layers.
 *
 * Supports two view modes:
 *   'planisphere' — horizon-clipped circle, fixed scale, horizon ring
 *   'map'         — full unclipped sky, d3.zoom pan/zoom handled externally
 */

import type { SkyData } from '../data/loader';
import type { SkyState } from '../state/skyState';
import { julianDateAt } from '../astro/julian';
import { lstFromJD } from '../astro/sidereal';
import { buildZenithProjection } from '../projection/stereographic';
import { renderStarLayer } from './starLayer';
import { renderConstellationLayer } from './constellationLayer';
import { renderConstellationLabelLayer } from './constellationLabelLayer';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Fixed coordinate space — CSS scales the SVG element to fit any container
const VIEWBOX_SIZE = 600;
const CENTER = VIEWBOX_SIZE / 2;          // 300
const RADIUS = CENTER - 28;              // 272 — leaves room for cardinal labels

export { CENTER, RADIUS };

export class Renderer {
    private svg: SVGSVGElement;
    private data: SkyData;

    constructor(svg: SVGSVGElement, data: SkyData) {
        this.svg = svg;
        this.data = data;

        // Fixed viewBox: CSS handles all scaling
        this.svg.setAttribute('viewBox', `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');

        // Clip path circle at the fixed center + radius
        const clipCircle = this.svg.querySelector('#horizon-clip-circle');
        if (clipCircle) {
            clipCircle.setAttribute('cx', String(CENTER));
            clipCircle.setAttribute('cy', String(CENTER));
            clipCircle.setAttribute('r', String(RADIUS));
        }
    }

    // ── Background sky disk / rect ───────────────────────────────────────────

    private renderBackground(isMap: boolean): void {
        const layer = this.svg.querySelector('#layer-bg')!;
        layer.replaceChildren();

        if (isMap) {
            // Full-bleed dark sky rect that extends well beyond the viewBox
            // so it remains filled during pan/zoom
            const sky = document.createElementNS(SVG_NS, 'rect');
            sky.setAttribute('x', '-5000');
            sky.setAttribute('y', '-5000');
            sky.setAttribute('width', '11000');
            sky.setAttribute('height', '11000');
            sky.setAttribute('class', 'sky-disk');
            layer.appendChild(sky);
        } else {
            const sky = document.createElementNS(SVG_NS, 'circle');
            sky.setAttribute('cx', String(CENTER));
            sky.setAttribute('cy', String(CENTER));
            sky.setAttribute('r', String(RADIUS));
            sky.setAttribute('class', 'sky-disk');
            layer.appendChild(sky);
        }
    }

    // ── Toggle clip-path on star/constellation layers ─────────────────────────

    private setLayerClip(isMap: boolean): void {
        const clippedIds = ['layer-constellation', 'layer-const-labels', 'layer-stars', 'layer-labels'];
        for (const id of clippedIds) {
            const el = this.svg.querySelector(`#${id}`);
            if (!el) continue;
            if (isMap) {
                el.removeAttribute('clip-path');
            } else {
                el.setAttribute('clip-path', 'url(#horizon-clip)');
            }
        }
    }

    // ── Main render ──────────────────────────────────────────────────────────

    render(state: SkyState): void {
        const isMap = state.viewMode === 'map';

        // ── No layer clip-path in either mode — clip-path zooms with the stars and
        // is off-screen at any zoom ≥ 1. The sphere boundary is now a pure CSS overlay. ──
        this.setLayerClip(true); // always "map" behaviour: no clip

        // ── Observation time → Julian Date → Local Sidereal Time ──
        const jd = julianDateAt(state.date, state.timeOffsetMinutes, 0);
        const lst = lstFromJD(jd, state.longitude);

        // ── Zenith-centred stereographic projection ──
        const projection = buildZenithProjection({
            latitude: state.latitude,
            lst,
            radiusPx: RADIUS,
            cx: CENTER,
            cy: CENTER,
        });

        // ── Draw layers: back → front ──
        this.renderBackground(isMap);

        if (state.showConstellations) {
            renderConstellationLayer(
                this.svg.querySelector('#layer-constellation') as SVGGElement,
                this.data.constellationLines,
                projection,
            );
        } else {
            (this.svg.querySelector('#layer-constellation') as SVGGElement).replaceChildren();
        }

        if (state.showConstLabels) {
            renderConstellationLabelLayer(
                this.svg.querySelector('#layer-const-labels') as SVGGElement,
                this.data.constellationLabels,
                projection,
            );
        } else {
            (this.svg.querySelector('#layer-const-labels') as SVGGElement).replaceChildren();
        }

        // Magnitude cutoff driven by slider state
        const visibleStars = this.data.stars.filter((s) => s.mag <= state.magLimit);

        renderStarLayer(
            this.svg.querySelector('#layer-stars') as SVGGElement,
            this.svg.querySelector('#layer-labels') as SVGGElement,
            visibleStars,
            projection,
            state.showLabels,
            Infinity, // never cull by radius — CSS overlay clips what’s outside the sphere
        );

        // The SVG horizon ring is replaced by the #sphere-overlay HTML element;
        // clear the layer so nothing stale renders inside #layer-root (which
        // gets the zoom transform and would move the ring off-screen anyway).
        const horizonLayer = this.svg.querySelector('#layer-horizon') as SVGGElement;
        horizonLayer.replaceChildren();
    }
}
