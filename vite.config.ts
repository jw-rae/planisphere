import { defineConfig } from 'vite';

export default defineConfig({
    publicDir: 'public',
    build: {
        outDir: 'dist',
        target: 'es2020',
    },
});
