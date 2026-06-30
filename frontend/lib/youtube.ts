const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export interface YouTubeMedia {
  videoId: string;
  normalizedUrl: string;
  embedUrl: string;
}

function cleanVideoId(value: string | null | undefined) {
  const id = value?.trim() ?? "";
  return VIDEO_ID_PATTERN.test(id) ? id : null;
}

export function getYouTubeEmbedUrl(videoId: string) {
  return VIDEO_ID_PATTERN.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : null;
}

export function parseYouTubeUrl(value: string | null | undefined): YouTubeMedia | null {
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
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const segments = parsed.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = cleanVideoId(segments[0]);
  } else if (segments[0] === "watch") {
    videoId = cleanVideoId(parsed.searchParams.get("v"));
  } else if (["shorts", "embed", "live"].includes(segments[0])) {
    videoId = cleanVideoId(segments[1]);
  }

  if (!videoId) return null;

  return {
    videoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

export function isValidYouTubeUrl(value: string | null | undefined) {
  return Boolean(parseYouTubeUrl(value));
}
