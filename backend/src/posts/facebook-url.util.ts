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

export function normalizeFacebookUrl(value: string): NormalizedFacebookUrl {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new BadRequestException('Invalid Facebook URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new BadRequestException('Invalid Facebook URL protocol');
  }

  const host = parsed.hostname.toLowerCase();
  if (!FACEBOOK_HOSTS.has(host)) {
    throw new BadRequestException('Unsupported Facebook URL host');
  }

  const hasPath = parsed.pathname.split('/').filter(Boolean).length > 0;
  if (!hasPath) {
    throw new BadRequestException('Facebook URL is missing a video path');
  }

  parsed.hash = '';
  parsed.searchParams.delete('fbclid');

  return {
    facebookUrl: parsed.toString(),
  };
}
