/**
 * viewControl.ts
 * Handles the view-mode toggle (Planisphere ↔ Map) and magnitude-limit slider.
 */

import type { SkyStateStore, ViewMode } from '../state/skyState';

export class ViewControl {
    private store: SkyStateStore;

    private skyPanel: HTMLElement;
    private planisphereBtn: HTMLButtonElement;
    private mapBtn: HTMLButtonElement;
    private magSlider: HTMLInputElement;
    private magDisplay: HTMLOutputElement;
    private mapOverlay: HTMLElement;
    private constLabelsToggle: HTMLButtonElement;

    constructor(store: SkyStateStore) {
        this.store = store;

        this.planisphereBtn = document.getElementById('view-planisphere-btn') as HTMLButtonElement;
        this.mapBtn = document.getElementById('view-map-btn') as HTMLButtonElement;
        this.magSlider = document.getElementById('mag-slider') as HTMLInputElement;
        this.magDisplay = document.getElementById('mag-display') as HTMLOutputElement;
        this.mapOverlay = document.getElementById('map-controls-overlay') as HTMLElement;
        this.constLabelsToggle = document.getElementById('const-labels-toggle') as HTMLButtonElement;
        this.skyPanel = document.querySelector('.sky-panel') as HTMLElement;

        this.constLabelsToggle.addEventListener('click', () => {
            const next = !this.store.getState().showConstLabels;
            this.constLabelsToggle.setAttribute('aria-checked', String(next));
            this.store.setState({ showConstLabels: next });
        });

        this.planisphereBtn.addEventListener('click', () => this.setView('planisphere'));
        this.mapBtn.addEventListener('click', () => this.setView('map'));

        this.magSlider.addEventListener('input', () => {
            const val = parseFloat(this.magSlider.value);
            this.magDisplay.textContent = val.toFixed(1);
            this.store.setState({ magLimit: val });
        });

        // Keep UI in sync with external state changes
        this.store.subscribe(() => this.syncFromState());
        this.syncFromState();
    }

    private setView(mode: ViewMode): void {
        this.store.setState({ viewMode: mode });
    }

    private syncFromState(): void {
        const { viewMode, magLimit, showConstLabels } = this.store.getState();
        this.constLabelsToggle.setAttribute('aria-checked', String(showConstLabels));

        // Update view toggle button pressed states
        const isMap = viewMode === 'map';
        this.planisphereBtn.setAttribute('aria-pressed', String(!isMap));
        this.planisphereBtn.classList.toggle('view-btn--active', !isMap);
        this.mapBtn.setAttribute('aria-pressed', String(isMap));
        this.mapBtn.classList.toggle('view-btn--active', isMap);

        // Show/hide the floating map overlay (Reset View button)
        this.mapOverlay.classList.toggle('hidden', !isMap);

        // Expand the sky panel to fill its area in map mode
        // (planisphere mode constrains to 1:1 aspect ratio)
        this.skyPanel.classList.toggle('sky-panel--planisphere', !isMap);

        // Sync magnitude slider + display
        this.magSlider.value = String(magLimit);
        this.magDisplay.textContent = magLimit.toFixed(1);
    }
}
