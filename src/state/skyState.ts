/**
 * skyState.ts
 * Reactive state store for the planisphere.
 * Holds all observable values that drive rendering and UI.
 * Implemented fully in Step 6.
 */

export type ViewMode = 'planisphere' | 'map';

export interface SkyState {
    /** Local observation date (year, month, day) */
    date: Date;
    /** Minutes from midnight for the current time-of-day (0–1440) */
    timeOffsetMinutes: number;
    /** Observer latitude in decimal degrees (+N / −S) */
    latitude: number;
    /** Observer longitude in decimal degrees (+E / −W) */
    longitude: number;
    /** Whether to use the Geolocation API for lat/lon */
    autoDetect: boolean;
    /** Show constellation line overlay */
    showConstellations: boolean;
    /** Show constellation name labels */
    showConstLabels: boolean;
    /** Show bright-star name labels */
    showLabels: boolean;
    /** Maximum apparent magnitude to render (lower = fewer, brighter stars) */
    magLimit: number;
    /** Active view mode: horizon-clipped planisphere circle vs full-screen map */
    viewMode: ViewMode;
}

type Subscriber = () => void;

function makeDefaultState(): SkyState {
    const now = new Date();
    return {
        date: now,
        timeOffsetMinutes: now.getHours() * 60 + now.getMinutes(),
        latitude: 40.0, // default: mid-latitude northern hemisphere
        longitude: -74.0,
        autoDetect: false,
        showConstellations: true,
        showConstLabels: true,
        showLabels: true,
        magLimit: 4.5,
        viewMode: 'map',
    };
}

export class SkyStateStore {
    private state: SkyState = makeDefaultState();
    private subscribers: Subscriber[] = [];

    getState(): SkyState {
        return { ...this.state };
    }

    setState(partial: Partial<SkyState>): void {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    subscribe(fn: Subscriber): () => void {
        this.subscribers.push(fn);
        return () => {
            this.subscribers = this.subscribers.filter((s) => s !== fn);
        };
    }

    private notify(): void {
        for (const fn of this.subscribers) {
            fn();
        }
    }
}

export const skyState = new SkyStateStore();
