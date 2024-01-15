// vite.config.js
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "Dare",
    },
  },
  resolve: {
    alias: {
      "@sdk": resolve(__dirname, "src")
    },
  },
});
