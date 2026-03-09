/**
 * timeControl.ts
 * Manages month/day selects, time slider, and "Now" button.
 *
 * Year note: a planisphere is year-independent. The sidereal time difference
 * between the same calendar date in adjacent years is < 6 minutes (~1.5°),
 * imperceptible on screen. We always use the current year internally so the
 * Julian Date calculation is valid, but we never expose year to the user.
 */

import { SkyStateStore } from '../state/skyState';

const MONTH_LENGTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // allow 29 for Feb always

export class TimeControl {
    private monthSelect: HTMLSelectElement;
    private daySelect: HTMLSelectElement;
    private timeSlider: HTMLInputElement;
    private timeDisplay: HTMLOutputElement;
    private nowButton: HTMLButtonElement;

    constructor(private store: SkyStateStore) {
        this.monthSelect = document.getElementById('month-select') as HTMLSelectElement;
        this.daySelect = document.getElementById('day-select') as HTMLSelectElement;
        this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
        this.timeDisplay = document.getElementById('time-display') as HTMLOutputElement;
        this.nowButton = document.getElementById('now-btn') as HTMLButtonElement;

        this.syncFromState();
        this.attachListeners();
    }

    // ── Initialise from current state ──────────────────────────────────────

    private syncFromState(): void {
        const state = this.store.getState();
        const month = state.date.getMonth() + 1; // 1-based
        const day = state.date.getDate();

        this.monthSelect.value = String(month);
        this.populateDays(month, day);

        this.timeSlider.value = String(state.timeOffsetMinutes);
        this.renderTimeDisplay(state.timeOffsetMinutes);
    }

    // ── Populate day options for the chosen month ───────────────────────────

    private populateDays(month: number, selectedDay: number): void {
        const maxDay = MONTH_LENGTHS[month - 1];
        const clamped = Math.min(selectedDay, maxDay);

        this.daySelect.replaceChildren();
        for (let d = 1; d <= maxDay; d++) {
            const opt = document.createElement('option');
            opt.value = String(d);
            opt.textContent = String(d);
            if (d === clamped) opt.selected = true;
            this.daySelect.appendChild(opt);
        }
    }

    // ── Event listeners ────────────────────────────────────────────────────

    private attachListeners(): void {
        this.monthSelect.addEventListener('change', () => {
            const month = Number(this.monthSelect.value);
            const day = Math.min(Number(this.daySelect.value), MONTH_LENGTHS[month - 1]);
            this.populateDays(month, day);
            this.commitDate(month, day);
        });

        this.daySelect.addEventListener('change', () => {
            this.commitDate(Number(this.monthSelect.value), Number(this.daySelect.value));
        });

        this.timeSlider.addEventListener('input', () => {
            const minutes = Number(this.timeSlider.value);
            this.renderTimeDisplay(minutes);
            this.store.setState({ timeOffsetMinutes: minutes });
        });

        this.nowButton.addEventListener('click', () => {
            const now = new Date();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const minutes = now.getHours() * 60 + now.getMinutes();

            this.monthSelect.value = String(month);
            this.populateDays(month, day);
            this.timeSlider.value = String(minutes);
            this.renderTimeDisplay(minutes);
            this.store.setState({ date: now, timeOffsetMinutes: minutes });
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /** Build a Date in the current year for the chosen month/day, then push to state. */
    private commitDate(month: number, day: number): void {
        const year = new Date().getFullYear(); // year-independent for planisphere
        const d = new Date(year, month - 1, day);
        this.store.setState({ date: d });
    }

    private renderTimeDisplay(minutes: number): void {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        this.timeDisplay.value = `${h}:${m}`;
    }
}
