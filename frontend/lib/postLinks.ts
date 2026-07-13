export const MAX_EXTERNAL_LINKS = 5;
export const MAX_LINK_STORAGE_LENGTH = 2048;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

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

export const parseExternalLinks = (value?: string | null): string[] => {
  const raw = value?.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (isStringArray(parsed)) {
      return cleanExternalLinks(parsed);
    }
  } catch {
    // Fall back to legacy single-link or newline-separated values.
  }

  return cleanExternalLinks(raw.split(/\r?\n/));
};

export const serializeExternalLinks = (links: string[]) => {
  const cleaned = cleanExternalLinks(links);
  return cleaned.length > 0 ? JSON.stringify(cleaned) : "";
};

export const isValidExternalLink = (link: string) => {
  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const areExternalLinksValid = (value?: string | null) => {
  const links = parseExternalLinks(value);
  if (links.length === 0) return true;

  return (
    serializeExternalLinks(links).length <= MAX_LINK_STORAGE_LENGTH &&
    links.every(isValidExternalLink)
  );
};

export const formatExternalLinkLabel = (link: string) =>
  link.replace(/^https?:\/\//, "").replace(/\/$/, "");
