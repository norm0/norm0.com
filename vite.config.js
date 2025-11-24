import { resolve } from 'path';

export default {
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'source/assets/javascripts/index.js'),
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: '[name][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'source/assets')
    }
  }
};
