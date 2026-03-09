/**
 * themeControl.ts
 * Dark/light mode toggle + theme color selector.
 * Persists preferences to localStorage and applies via data-color-scheme / data-theme
 * attributes on <html> — matching @jwrae/design-tokens conventions.
 */

const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;

const THEMES: { value: string; label: string; color: string }[] = [
    { value: 'warm', label: 'Warm', color: '#777674' },
    { value: 'cool', label: 'Cool', color: '#71747e' },
    { value: 'pink', label: 'Pink', color: '#937886' },
    { value: 'green', label: 'Green', color: '#7c7e7c' },
    { value: 'blue', label: 'Blue', color: '#757b87' },
];

export class ThemeControl {
    private modeBtn: HTMLButtonElement;
    private pickerBtn: HTMLButtonElement;
    private menu: HTMLDivElement;
    private isDark: boolean;
    private currentTheme: string;
    private menuOpen = false;

    constructor() {
        this.modeBtn = document.getElementById('theme-mode-btn') as HTMLButtonElement;
        this.pickerBtn = document.getElementById('theme-picker-btn') as HTMLButtonElement;
        this.menu = document.getElementById('theme-color-menu') as HTMLDivElement;

        // ── Read persisted preferences ──────────────────────────────────────
        const savedScheme = localStorage.getItem('theme-mode') ?? 'dark';
        const savedTheme = localStorage.getItem('theme') ?? 'blue';

        this.isDark = savedScheme === 'dark';
        this.currentTheme = savedTheme;

        this.applyScheme(this.isDark, false);
        this.applyTheme(this.currentTheme, false);

        // ── Build theme color menu items ─────────────────────────────────────
        for (const t of THEMES) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-menu-item';
            btn.dataset.themeValue = t.value;
            btn.innerHTML = `<span class="theme-color-dot" style="background:${t.color}"></span><span class="theme-color-name">${t.label}</span>`;
            btn.addEventListener('click', () => {
                this.applyTheme(t.value, true);
                this.closeMenu();
            });
            this.menu.appendChild(btn);
        }

        // ── Events ──────────────────────────────────────────────────────────
        this.modeBtn.addEventListener('click', () => {
            this.isDark = !this.isDark;
            this.applyScheme(this.isDark, true);
        });

        this.pickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.menuOpen ? this.closeMenu() : this.openMenu();
        });

        document.addEventListener('click', (e) => {
            if (this.menuOpen && !this.menu.contains(e.target as Node) && e.target !== this.pickerBtn) {
                this.closeMenu();
            }
        });

        this.updateModeIcon();
        this.updateActiveTheme();
    }

    private applyScheme(dark: boolean, persist: boolean): void {
        document.documentElement.setAttribute('data-color-scheme', dark ? 'dark' : 'light');
        if (persist) localStorage.setItem('theme-mode', dark ? 'dark' : 'light');
        this.updateModeIcon();
    }

    private applyTheme(theme: string, persist: boolean): void {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        if (persist) localStorage.setItem('theme', theme);
        this.updateActiveTheme();
    }

    private updateModeIcon(): void {
        this.modeBtn.innerHTML = this.isDark ? SUN_SVG : MOON_SVG;
        this.modeBtn.setAttribute('aria-label', this.isDark ? 'Switch to light mode' : 'Switch to dark mode');
        this.modeBtn.title = this.modeBtn.getAttribute('aria-label')!;
    }

    private updateActiveTheme(): void {
        this.menu.querySelectorAll<HTMLElement>('.theme-menu-item').forEach((el) => {
            el.classList.toggle('theme-menu-item--active', el.dataset.themeValue === this.currentTheme);
        });
    }

    private openMenu(): void {
        this.menuOpen = true;
        this.menu.classList.add('theme-color-menu--open');
    }

    private closeMenu(): void {
        this.menuOpen = false;
        this.menu.classList.remove('theme-color-menu--open');
    }
}
