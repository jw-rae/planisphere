/**
 * app.ts
 * Top-level application bootstrap.
 * Wires data loading, state, rendering, and UI controls together.
 */

import { loadSkyData } from './data/loader';
import { skyState } from './state/skyState';
import { Renderer } from './rendering/renderer';
import { TimeControl } from './ui/timeControl';
import { LatitudeControl } from './ui/latitudeControl';
import { ViewControl } from './ui/viewControl';
import { MapZoom } from './ui/mapZoom';

export async function initApp(): Promise<void> {
    // Load sky data
    const data = await loadSkyData();

    // Mount renderer
    const svgEl = document.getElementById('planisphere-svg') as unknown as SVGSVGElement;
    const renderer = new Renderer(svgEl, data);

    // Subscribe renderer to state changes
    skyState.subscribe(() => {
        renderer.render(skyState.getState());
    });

    // Mount UI controls
    new TimeControl(skyState);
    new LatitudeControl(skyState);
    new ViewControl(skyState);
    new MapZoom(skyState);

    // ── Collapsible panel toggle ──────────────────────────────────────────────
    const panelToggleBtn = document.getElementById('panel-toggle-btn');
    const controlsPanel = document.getElementById('controls-panel');
    const appLayout = document.querySelector('.app-layout') as HTMLElement;

    panelToggleBtn?.addEventListener('click', () => {
        const isCollapsed = appLayout.classList.toggle('panel-collapsed');
        panelToggleBtn.textContent = isCollapsed ? '‹' : '›';
        panelToggleBtn.setAttribute('aria-label', isCollapsed ? 'Open controls panel' : 'Close controls panel');
        controlsPanel?.setAttribute('aria-hidden', String(isCollapsed));
    });

    // Initial render
    renderer.render(skyState.getState());
}
