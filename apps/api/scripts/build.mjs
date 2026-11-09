// Bundles the API with esbuild (incl. the @hisab/shared TypeScript workspace package):
//   dist/server.mjs              - standalone Node server (Docker / VPS: `node dist/server.mjs`)
//   .vercel/output/              - Vercel Build Output API v3: one Node.js function serving every route
// Plain `tsc` output can't run on Node: imports have no .js extensions and @hisab/shared ships .ts.
import { build } from 'esbuild';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(root, ...p);

const common = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  legalComments: 'none',
  logLevel: 'warning',
  // Some bundled dependencies still call require(); give ESM output a real one
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  // Only used by drizzle-kit (migrations), never at runtime
  external: ['pg', 'pg-native'],
};

// 1. Standalone server
await rm(out('dist'), { recursive: true, force: true });
await build({ ...common, entryPoints: [out('src/index.ts')], outfile: out('dist/server.mjs') });

// 2. Vercel Build Output API (https://vercel.com/docs/build-output-api/v3)
const vercelOut = out('.vercel/output');
const funcDir = path.join(vercelOut, 'functions/api.func');
await rm(vercelOut, { recursive: true, force: true });
await mkdir(funcDir, { recursive: true });
await build({ ...common, entryPoints: [out('src/vercel.ts')], outfile: path.join(funcDir, 'index.mjs') });

await writeFile(
  path.join(funcDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 30,
    },
    null,
    2
  )
);
await writeFile(
  path.join(vercelOut, 'config.json'),
  JSON.stringify({ version: 3, routes: [{ src: '/(.*)', dest: '/api' }] }, null, 2)
);

console.log('✓ dist/server.mjs and .vercel/output built');
