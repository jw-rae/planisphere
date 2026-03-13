import { defineConfig } from 'vite';

export default defineConfig({
    publicDir: 'public',
    build: {
        outDir: 'dist',
        target: 'es2020',
    },
    // Base can be overridden via CLI: vite build --base=/some/path/
    // or set VITE_BASE env var. Defaults to '/' for local dev.
    base: process.env.VITE_BASE ?? '/',
});
