import { defineConfig } from "vite";

export default defineConfig({
  // near-api-js's ABI validator requires Node's "util"; it's unused in the browser
  resolve: { alias: { util: "/src/shims/util.ts" } },
});
