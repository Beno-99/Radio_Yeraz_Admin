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

function getFacebookUrlCandidates(value: string) {
  const input = value.replace(/^['"]+|['"]+$/g, "").trim();
  if (!input) return [];

  const candidates = [input];
  if (/^(?:videos|watch|reel|share)\//i.test(input)) {
    candidates.push(`https://www.facebook.com/${input.replace(/^\/+/, "")}`);
  }

  return candidates;
}

export function parseFacebookUrl(
  value: string | null | undefined,
): FacebookMedia | null {
  const input = value?.trim();
  if (!input) return null;

  for (const candidate of getFacebookUrlCandidates(input)) {
    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      continue;
    }

    if (!["http:", "https:"].includes(parsed.protocol)) continue;

    const host = parsed.hostname.toLowerCase();
    if (!FACEBOOK_HOSTS.has(host)) continue;

    const hasPath = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean).length > 0;
    if (!hasPath) continue;

    parsed.protocol = "https:";
    parsed.hash = "";
    parsed.searchParams.delete("fbclid");

    const normalizedUrl = parsed.toString();

    return {
      normalizedUrl,
      embedUrl: getFacebookEmbedUrl(normalizedUrl) || "",
    };
  }

  return null;
}

export function isValidFacebookUrl(value: string | null | undefined) {
  return Boolean(parseFacebookUrl(value));
}
