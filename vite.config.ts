/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build --mode artifact` inlines everything into one HTML file (see scripts/make-artifact.mjs).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'artifact' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
