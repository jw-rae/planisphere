/**
 * latitudeControl.ts
 * Manages:
 *   – Auto-detect geolocation toggle
 *   – Manual latitude slider (visible when auto-detect is off)
 *   – Constellation lines and star-label display toggles
 */

import { SkyStateStore } from '../state/skyState';

export class LatitudeControl {
    private autoToggle: HTMLButtonElement;
    private manualLatRow: HTMLElement;
    private latSlider: HTMLInputElement;
    private latOutput: HTMLOutputElement;
    private constellationToggle: HTMLButtonElement;
    private labelsToggle: HTMLButtonElement;

    constructor(private store: SkyStateStore) {
        this.autoToggle = document.getElementById('auto-locate-toggle') as HTMLButtonElement;
        this.manualLatRow = document.getElementById('manual-lat-row') as HTMLElement;
        this.latSlider = document.getElementById('lat-slider') as HTMLInputElement;
        this.latOutput = document.getElementById('lat-output') as HTMLOutputElement;
        this.constellationToggle = document.getElementById('constellation-toggle') as HTMLButtonElement;
        this.labelsToggle = document.getElementById('labels-toggle') as HTMLButtonElement;

        this.syncFromState();
        this.attachListeners();
    }

    // ── Initialise from current state ──────────────────────────────────────

    private syncFromState(): void {
        const state = this.store.getState();
        this.setToggleState(this.autoToggle, state.autoDetect);
        this.setToggleState(this.constellationToggle, state.showConstellations);
        this.setToggleState(this.labelsToggle, state.showLabels);
        this.latSlider.value = String(state.latitude);
        this.renderLatOutput(state.latitude);
        this.setManualLatVisibility(!state.autoDetect);
    }

    // ── Event listeners ────────────────────────────────────────────────────

    private attachListeners(): void {
        // Auto-detect toggle
        this.autoToggle.addEventListener('click', () => {
            const next = this.store.getState().autoDetect === false;
            this.setToggleState(this.autoToggle, next);
            this.store.setState({ autoDetect: next });
            this.setManualLatVisibility(!next);
            if (next) this.requestGeolocation();
        });

        // Manual latitude slider
        this.latSlider.addEventListener('input', () => {
            const lat = Number(this.latSlider.value);
            this.renderLatOutput(lat);
            this.store.setState({ latitude: lat });
        });

        // Display option toggles
        this.constellationToggle.addEventListener('click', () => {
            const next = !this.store.getState().showConstellations;
            this.setToggleState(this.constellationToggle, next);
            this.store.setState({ showConstellations: next });
        });

        this.labelsToggle.addEventListener('click', () => {
            const next = !this.store.getState().showLabels;
            this.setToggleState(this.labelsToggle, next);
            this.store.setState({ showLabels: next });
        });

        // Keep slider in sync if geolocation updates the state
        this.store.subscribe(() => {
            const state = this.store.getState();
            if (state.autoDetect) {
                this.latSlider.value = String(state.latitude.toFixed(1));
                this.renderLatOutput(state.latitude);
            }
        });
    }

    // ── Geolocation ────────────────────────────────────────────────────────

    private requestGeolocation(): void {
        if (!navigator.geolocation) {
            this.store.setState({ autoDetect: false });
            this.setToggleState(this.autoToggle, false);
            this.setManualLatVisibility(true);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                this.store.setState({ latitude: lat, longitude: lon });
                this.latSlider.value = String(lat.toFixed(1));
                this.renderLatOutput(lat);
            },
            () => {
                this.store.setState({ autoDetect: false });
                this.setToggleState(this.autoToggle, false);
                this.setManualLatVisibility(true);
            },
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /** Show/hide the manual latitude row. */
    private setManualLatVisibility(visible: boolean): void {
        this.manualLatRow.classList.toggle('hidden', !visible);
    }

    /** Inline output next to the slider knob. */
    private renderLatOutput(lat: number): void {
        const hemi = lat >= 0 ? 'N' : 'S';
        this.latOutput.value = `${Math.abs(lat).toFixed(1)}° ${hemi}`;
    }


    private setToggleState(btn: HTMLButtonElement, on: boolean): void {
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    }
}
