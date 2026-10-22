import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@shadow-js/compiler";
import { createConfig } from "./build/tsdown-preset.mjs";

/**
 * The sources are TSX, so every build runs the ShadowJS compiler: the `dom` target for the
 * browser builds (dev and prod) and the `ssr` target for the `server` condition build. Library code
 * is compiled with `autoReactive: false`: it spells out every accessor, so nothing is rewritten.
 * @param {"dom" | "ssr"} generate
 * @param {boolean} dev
 */
function shadowCompile(generate, dev) {
  return {
    name: "shadowjs-compile",
    // The server runtime keeps its own hydration scope, so the server build reads keys from it. A
    // part's tag renderer is a closed table of server templates on the server and `Dynamic` on the client.
    resolveId(source, importer) {
      if (generate !== "ssr" || importer === undefined) return null;
      if (source.endsWith("/hydration-key"))
        return resolve(dirname(importer), `${source}-server.ts`);
      if (source.endsWith("/polymorphic-tags")) {
        return resolve(dirname(importer), `${source}-server.tsx`);
      }
      return null;
    },
    transform: {
      filter: { id: /\.tsx$/ },
      handler(_code, id) {
        const source = readFileSync(id, "utf8");
        const result = compile(source, {
          filename: id,
          generate,
          dev,
          autoReactive: false,
          hmr: false,
          sourceMap: true,
        });
        return {
          code: result.code, // A module without JSX comes back unchanged: an empty map says so and keeps the bundle's map exact.
          map: result.map ?? { mappings: "" },
          moduleType: "ts",
        };
      },
    },
  };
}

const SRC = join(dirname(fileURLToPath(import.meta.url)), "src");
// One entry per part (`./dialog`, `./select`, ...): a part is a folder whose index exports it. Rolldown
// does not emit an index that only re-exports, so each part index is an entry; its subpath export
// points at it. `utils` is the shared helper entry, `index` the whole package.
const partEntries = {};
for (const dirent of readdirSync(SRC, { withFileTypes: true })) {
  if (!dirent.isDirectory() || dirent.name === "utils") continue;
  for (const extension of ["ts", "tsx"]) {
    if (existsSync(join(SRC, dirent.name, `index.${extension}`))) {
      partEntries[`${dirent.name}/index`] = `src/${dirent.name}/index.${extension}`;
      break;
    }
  }
}
const entries = { index: "src/index.ts", utils: "src/utils.ts", ...partEntries };

// Browser builds (dev, prod) and the server builds come from the shared preset; the plugin picks
// the compiler target from the output directory.
const configs = createConfig({
  entries,
  serverEntries: entries,
  packageDir: import.meta.dirname,
  unbundle: true,
});

export default configs.map((config) => {
  const server = config.outDir === "dist/server" || config.outDir === "dist/server-dev";
  const dev = config.outDir === "dist/dev" || config.outDir === "dist/server-dev";
  return { ...config, plugins: [shadowCompile(server ? "ssr" : "dom", dev)] };
});
