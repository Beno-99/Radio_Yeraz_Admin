const defaultCorsOrigins = [
  'https://player.radioyeraz.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

export function buildAllowedOrigins(
  configuredOrigins = process.env.CORS_ORIGIN,
): string[] {
  const envOrigins = configuredOrigins
    ? configuredOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return Array.from(new Set([...envOrigins, ...defaultCorsOrigins]));
}
