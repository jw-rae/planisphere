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
import { ThemeControl } from './ui/themeControl';

export async function initApp(): Promise<void> {
    // ── Loading overlay ───────────────────────────────────────────────────────
    const loadingOverlay = document.getElementById('loading-overlay') as HTMLElement | null;

    function dismissOverlay(): void {
        if (!loadingOverlay) return;
        loadingOverlay.classList.add('is-fading');
        loadingOverlay.addEventListener('transitionend', () => loadingOverlay.remove(), { once: true });
    }

    function showError(message: string): void {
        if (!loadingOverlay) return;
        loadingOverlay.innerHTML = `
            <div class="loading-error">
                <span class="loading-error-icon" aria-hidden="true">✦</span>
                <p class="loading-error-msg">${message}</p>
                <button id="retry-btn" class="btn-secondary">Try again</button>
            </div>`;
        document.getElementById('retry-btn')?.addEventListener('click', () => window.location.reload());
    }

    // Load sky data
    let data: Awaited<ReturnType<typeof loadSkyData>>;
    try {
        data = await loadSkyData();
    } catch (err) {
        console.error('[planisphere] Failed to load sky data:', err);
        showError('Could not load sky data. Check your connection and try again.');
        return;
    }

    // Mount renderer
    const svgEl = document.getElementById('planisphere-svg') as unknown as SVGSVGElement;
    const renderer = new Renderer(svgEl, data);

    // Subscribe renderer to state changes
    skyState.subscribe(() => {
        renderer.render(skyState.getState());
        mapZoom.syncTiers();
    });

    // Mount UI controls
    new TimeControl(skyState);
    new LatitudeControl(skyState);
    new ViewControl(skyState);
    const mapZoom = new MapZoom(skyState);
    new ThemeControl();

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
    mapZoom.syncTiers();

    // All ready — fade out and remove the loading overlay
    dismissOverlay();
}
