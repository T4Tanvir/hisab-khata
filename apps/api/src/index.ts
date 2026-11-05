import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from './env';

console.log(`Starting API server on port ${env.PORT}...`);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`🚀 API Server running at http://localhost:${info.port}`);
  }
);

