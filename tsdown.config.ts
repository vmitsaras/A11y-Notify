import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    docs: 'src/docs.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
