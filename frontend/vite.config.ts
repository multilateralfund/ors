import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: "@ors/registry", replacement: path.join(__dirname, './src/config/base') },
      { find: "@ors/types", replacement: path.join(__dirname, './src/@types')} ,
      { find: "@ors", replacement: path.join(__dirname, './src') },
      // { find: "tailwind-config", replacement: path.join(__dirname, './tailwind.config.js') },
      { find: "~", replacement: path.join(__dirname, './') },
    ],
  },
  build: {
    sourcemap: true
  //   commonjsOptions: {
  //     include: ['tailwind-config.cjs', 'node_modules/**'],
  //     transformMixedEsModules: true
  //   },
  },
  // optimizeDeps: {
  //   include: ['tailwind-config'],
  // },
  plugins: [svgr(), react()],
})
