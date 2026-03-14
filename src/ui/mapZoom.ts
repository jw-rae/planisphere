/**
 * mapZoom.ts
 * Applies d3.zoom pan/zoom behaviour to the SVG in map mode.
 *
 * Two side-effects per zoom event (both zero-rerender):
 *  1. Sets --zoom-k CSS variable on the SVG → CSS counter-scales .star-label font-size
 *  2. Toggles data-label-tier group visibility for progressive label disclosure
 */

import * as d3 from 'd3';
import type { SkyStateStore } from '../state/skyState';
import { LABEL_TIERS } from '../rendering/starLayer';
import { CONST_LABEL_TIERS } from '../rendering/constellationLabelLayer';

export class MapZoom {
    private svg: SVGSVGElement;
    private layerRoot: SVGGElement;
    private labelLayer: HTMLElement;
    private constLabelLayer: HTMLElement;
    private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
    private currentK = 1;
    private locked = false; // true in sphere mode — blocks all user interaction

    constructor(store: SkyStateStore) {
        this.svg = document.getElementById('planisphere-svg') as unknown as SVGSVGElement;
        this.layerRoot = document.getElementById('layer-root') as unknown as SVGGElement;
        this.labelLayer = document.getElementById('layer-labels')!;
        this.constLabelLayer = document.getElementById('layer-const-labels')!;

        this.zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([1.8, 25])
            // Bound panning to the SVG viewBox content — can't drag sky off screen
            .translateExtent([[0, 0], [600, 600]])
            .filter((event) => {
                // Block everything in sphere mode
                if (this.locked) return false;
                if (event.type === 'dblclick') return false;
                if (event.button !== undefined && event.button !== 0) return false;
                // Block single-touch pan and mouse drag at minimum zoom, but always
                // allow multi-touch pinch-to-zoom (2+ fingers) so mobile users can
                // zoom in from the initial view.
                const isSingleTouchPan =
                    event.type === 'touchstart' && (event.touches?.length ?? 1) < 2;
                if ((event.type === 'mousedown' || isSingleTouchPan) && this.currentK <= 1.81) return false;
                return true;
            })
            .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                const { x, y, k } = event.transform;
                this.currentK = k;

                // Apply pan/zoom transform to the layer group
                this.layerRoot.setAttribute(
                    'transform',
                    `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${k.toFixed(4)})`,
                );

                // Counter-scale labels so they stay the same visual size on screen
                this.svg.style.setProperty('--zoom-k', k.toFixed(4));

                // Reveal additional label tiers as user zooms in
                this.updateLabelTiers(k);
                this.updateConstLabelTiers(k);

                console.log(`[zoom] x=${x.toFixed(1)} y=${y.toFixed(1)} k=${k.toFixed(3)}`);
            });

        // Reset View button
        document.getElementById('reset-view-btn')?.addEventListener('click', () => this.resetView());

        // React to view-mode state changes
        store.subscribe(() => {
            const { viewMode } = store.getState();
            this.setMapMode(viewMode === 'map');
        });

        // Init
        this.setMapMode(store.getState().viewMode === 'map');
    }

    /** Re-apply current zoom level to label tiers after a re-render. */
    syncTiers(): void {
        this.updateLabelTiers(this.currentK);
        this.updateConstLabelTiers(this.currentK);
    }

    /** Show/hide label tier <g> elements based on current zoom level. */
    private updateLabelTiers(k: number): void {
        for (let i = 0; i < LABEL_TIERS.length; i++) {
            const el = this.labelLayer.querySelector(`[data-label-tier="${i}"]`);
            if (!el) continue;
            el.classList.toggle('label-tier--hidden', k < LABEL_TIERS[i].minZoom);
        }
    }
    /** Show/hide constellation label tier <g> elements based on current zoom level. */
    private updateConstLabelTiers(k: number): void {
        for (let i = 0; i < CONST_LABEL_TIERS.length; i++) {
            const el = this.constLabelLayer.querySelector(`[data-const-tier="${i}"]`);
            if (!el) continue;
            el.classList.toggle('const-label-tier--hidden', k < CONST_LABEL_TIERS[i].minZoom);
        }
    }
    private setMapMode(enabled: boolean): void {
        const sel = d3.select<SVGSVGElement, unknown>(this.svg);
        // Zoom behavior stays attached in both modes so programmatic transforms work.
        // In sphere mode lock the filter so no user pan/zoom events get through.
        this.locked = !enabled;
        sel.call(this.zoom);
        this.svg.classList.toggle('svg--pannable', enabled);
        // Always snap to home position when switching modes.
        requestAnimationFrame(() => this.jumpToInitialZoom());
    }

    /** Jump to the confirmed home position (user-tuned via console). */
    private jumpToInitialZoom(): void {
        const t = d3.zoomIdentity.translate(-235.4, -238.6).scale(1.8);
        d3.select<SVGSVGElement, unknown>(this.svg).call(this.zoom.transform, t);
    }

    resetView(): void {
        this.jumpToInitialZoom();
    }
}
