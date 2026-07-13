const MAX_EXTERNAL_LINKS = 5;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const cleanExternalLinks = (links: string[]) => {
  const seen = new Set<string>();

  return links
    .map((link) => link.trim())
    .filter(Boolean)
    .filter((link) => {
      if (seen.has(link)) return false;
      seen.add(link);
      return true;
    })
    .slice(0, MAX_EXTERNAL_LINKS);
};

const parseLinkString = (value: string) => {
  const raw = value.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (isStringArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to a legacy single URL or newline-separated value.
  }

  return raw.split(/\r?\n/);
};

export const normalizePostLinks = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return '';

  const values = Array.isArray(value) ? value : [value];
  const links = cleanExternalLinks(
    values.flatMap((item) => (typeof item === 'string' ? parseLinkString(item) : [])),
  );

  return links.length > 0 ? JSON.stringify(links) : '';
};
