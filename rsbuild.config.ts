import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

import path from 'node:path';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],

  source: {
    entry: {
      '': './src/index.jsx',
    },
    include: [path.resolve(__dirname, 'node_modules')],
  },
  mode: "production",
  output: {
    filenameHash: false,
    injectStyles: true,
    filename: {
      js: "bundle.js",
      css: "index.css",
      html: "index.html",
    },

    distPath: {
      root: "build",
      js: ".",
      css: ".",
      html: ".",

    },
    assetPrefix: "./",
  },

  dev: {
    // assetPrefix: "./",
  },

  performance: {
    chunkSplit: {
      strategy: "all-in-one",
    },

  },
  resolve: {

    alias: {
      '@components': './src/components',
      '@pages': './src/pages',
      '@assets': './src/assets',
      '@utils': './src/utils',
      '@styles': './src/styles',
      '@types': './src/types',
      '@contexts': './src/contexts',
      '@configs': './src/configs',
      '@layouts': './src/layouts',
      '@services': './src/services',
      '@store': './src/store',
    },
  },
});
