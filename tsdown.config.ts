import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/lib/index.ts'],
  dts: true,
  sourcemap: true,
  outDir: './src/lib/dist',
  format:['esm', 'cjs']
});