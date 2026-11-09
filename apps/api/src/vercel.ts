import { handle } from '@hono/node-server/vercel';
import { app } from './app';

/**
 * Vercel Function entry: the whole Hono API as one Node.js function.
 * Every request path is routed here by .vercel/output/config.json (see scripts/build.mjs).
 */
export default handle(app);
