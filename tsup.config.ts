import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: [
    'cjs',
    'esm',
  ],
  dts: true,
  sourcemap: true,
  external: [
    'vue',
    'remark-parse',
    'remark-rehype',
  ],
})
