import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@dare/web-sdk/dev":
        process.env.NODE_ENV === "production"
          ? "@dare/web-sdk"
          : "@dare/web-sdk/dev",
      "@sdk": resolve(__dirname, "../../packages/sdk/src"),
    },
  },
});
