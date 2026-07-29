import { BadRequestException } from '@nestjs/common';

const FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
]);

export interface NormalizedFacebookUrl {
  facebookUrl: string;
}

function getFacebookUrlCandidates(value: string) {
  const input = value.replace(/^['"]+|['"]+$/g, '').trim();
  if (!input) return [];

  const candidates = [input];
  if (/^(?:videos|watch|reel|share)\//i.test(input)) {
    candidates.push(`https://www.facebook.com/${input.replace(/^\/+/, '')}`);
  }

  return candidates;
}

export function normalizeFacebookUrl(value: string): NormalizedFacebookUrl {
  for (const candidate of getFacebookUrlCandidates(value)) {
    let parsed: URL;

    try {
      parsed = new URL(candidate);
    } catch {
      continue;
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      continue;
    }

    const host = parsed.hostname.toLowerCase();
    if (!FACEBOOK_HOSTS.has(host)) {
      continue;
    }

    const hasPath = parsed.pathname.split('/').filter(Boolean).length > 0;
    if (!hasPath) {
      throw new BadRequestException('Facebook URL is missing a video path');
    }

    parsed.protocol = 'https:';
    parsed.hash = '';
    parsed.searchParams.delete('fbclid');

    return {
      facebookUrl: parsed.toString(),
    };
  }

  throw new BadRequestException('Invalid Facebook video or live URL');
}
