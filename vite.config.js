import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// import babel from "@vitejs/plugin-babel";

export default defineConfig({
  plugins: [react()],
  root: ".", // Root remains the project root
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@server": path.resolve(__dirname, "src/server"),
      "@app": path.resolve(__dirname, "src/app"),
      "@context": path.resolve(__dirname, "src/context"),
      "@config": path.resolve(__dirname, "src/config"),
    },
  },
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: "build", // Outputs to the build folder
    sourcemap: false,
  },
});
