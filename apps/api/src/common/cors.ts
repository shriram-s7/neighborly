const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4000'];

/**
 * Allowed browser origins. Set CORS_ORIGIN to a comma-separated list
 * (e.g. "https://neighborly.vercel.app,http://localhost:5173").
 * Read lazily so it works even when evaluated before dotenv has loaded.
 */
export function allowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ORIGINS;
}

/** Origin callback shared by the HTTP server and the Socket.IO gateway. */
export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  // Non-browser clients (curl, server-to-server) send no Origin header.
  if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
  callback(null, false);
}
