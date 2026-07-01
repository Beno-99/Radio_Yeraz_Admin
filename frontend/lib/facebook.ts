const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.watch",
]);

export interface FacebookMedia {
  normalizedUrl: string;
  embedUrl: string;
}

export function getFacebookEmbedUrl(value: string | null | undefined) {
  const input = value?.trim();
  if (!input) return null;

  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    input,
  )}&show_text=false&width=560`;
}

export function parseFacebookUrl(
  value: string | null | undefined,
): FacebookMedia | null {
  const input = value?.trim();
  if (!input) return null;

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;

  const host = parsed.hostname.toLowerCase();
  if (!FACEBOOK_HOSTS.has(host)) return null;

  const hasPath = parsed.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean).length > 0;
  if (!hasPath) return null;

  parsed.hash = "";
  parsed.searchParams.delete("fbclid");

  const normalizedUrl = parsed.toString();

  return {
    normalizedUrl,
    embedUrl: getFacebookEmbedUrl(normalizedUrl) || "",
  };
}

export function isValidFacebookUrl(value: string | null | undefined) {
  return Boolean(parseFacebookUrl(value));
}
