import { BadRequestException } from '@nestjs/common';

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export interface NormalizedYoutubeUrl {
  youtubeUrl: string;
  youtubeVideoId: string;
}

function cleanVideoId(value: string | null | undefined): string | null {
  if (!value) return null;

  const [id] = value.split(/[?&#/]/);
  return VIDEO_ID_PATTERN.test(id) ? id : null;
}

export function normalizeYoutubeUrl(value: string): NormalizedYoutubeUrl {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new BadRequestException('Invalid YouTube URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new BadRequestException('Invalid YouTube URL protocol');
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    throw new BadRequestException('Unsupported YouTube URL host');
  }

  let videoId: string | null = null;
  const segments = parsed.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    videoId = cleanVideoId(segments[0]);
  } else if (parsed.pathname === '/watch') {
    videoId = cleanVideoId(parsed.searchParams.get('v'));
  } else if (
    ['shorts', 'embed', 'live'].includes(segments[0] || '')
  ) {
    videoId = cleanVideoId(segments[1]);
  }

  if (!videoId) {
    throw new BadRequestException('YouTube URL is missing a valid video ID');
  }

  return {
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    youtubeVideoId: videoId,
  };
}

export function buildYoutubeEmbedUrl(videoId: string): string {
  if (!VIDEO_ID_PATTERN.test(videoId)) {
    throw new BadRequestException('Invalid YouTube video ID');
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
