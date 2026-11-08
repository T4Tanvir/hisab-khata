import { env } from '../env';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Single source of truth for which browser origins may call the API with
 * credentials (used by both CORS and Better Auth's trustedOrigins).
 *
 * - Production: only the configured WEB_ORIGIN.
 * - Development/test: WEB_ORIGIN plus any http(s) origin whose hostname is
 *   exactly localhost / 127.0.0.1 (any port). The hostname is parsed, so look-alike
 *   domains such as "localhost.evil.com" are rejected.
 */
export function isAllowedOrigin(origin: string | null | undefined): origin is string {
  if (!origin) return false;
  if (origin === env.WEB_ORIGIN) return true;
  if (env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      LOCAL_HOSTNAMES.has(url.hostname) &&
      url.origin === origin
    );
  } catch {
    return false;
  }
}
