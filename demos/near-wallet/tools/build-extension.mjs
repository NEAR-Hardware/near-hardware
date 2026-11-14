// Bundles extension/src/*.js into extension/dist/ with esbuild.
//   node tools/build-extension.mjs [--watch]
// node_modules stay in tools/: Chrome refuses to load an unpacked extension
// that contains files or folders starting with "_", which node_modules has.
import * as esbuild from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ext = path.join(root, "extension");

const options = {
  entryPoints: ["background", "content", "inpage", "wallet"].map((n) => path.join(ext, "src", `${n}.js`)),
  outdir: path.join(ext, "dist"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "chrome120",
  minify: false,
  sourcemap: false,
  legalComments: "none",
  loader: { ".png": "dataurl" },
  alias: { util: path.join(ext, "src", "shims", "util.js") },
  nodePaths: [path.join(root, "tools", "node_modules")],
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
