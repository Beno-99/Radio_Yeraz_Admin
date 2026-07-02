import * as fs from 'fs';
import * as path from 'path';

export const UPLOADS_WEB_PREFIX = '/uploads';

const UPLOADS_DIRECTORIES = [
  ['posts', 'images'],
  ['posts', 'videos'],
  ['carousels'],
  ['images'],
  ['videos'],
  ['documents'],
  ['ads'],
] as const;

function ensureDirectory(directoryPath: string): string {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

export function getUploadsRoot(): string {
  const configuredRoot = process.env.UPLOADS_DIR?.trim();
  return path.resolve(configuredRoot || path.join(process.cwd(), 'uploads'));
}

export function ensureUploadsRoot(): string {
  return ensureDirectory(getUploadsRoot());
}

export function getUploadsDirectory(...segments: string[]): string {
  return path.join(getUploadsRoot(), ...segments);
}

export function ensureUploadsDirectory(...segments: string[]): string {
  return ensureDirectory(getUploadsDirectory(...segments));
}

export function ensureCommonUploadDirectories(): void {
  ensureUploadsRoot();
  for (const segments of UPLOADS_DIRECTORIES) {
    ensureUploadsDirectory(...segments);
  }
}

export function getPostsImagesDirectory(): string {
  return getUploadsDirectory('posts', 'images');
}

export function ensurePostsImagesDirectory(): string {
  return ensureUploadsDirectory('posts', 'images');
}

export function getPostsVideosDirectory(): string {
  return getUploadsDirectory('posts', 'videos');
}

export function ensurePostsVideosDirectory(): string {
  return ensureUploadsDirectory('posts', 'videos');
}

export function getCarouselImagesDirectory(): string {
  return getUploadsDirectory('carousels');
}

export function ensureCarouselImagesDirectory(): string {
  return ensureUploadsDirectory('carousels');
}

export function getGenericImagesDirectory(): string {
  return getUploadsDirectory('images');
}

export function ensureGenericImagesDirectory(): string {
  return ensureUploadsDirectory('images');
}

export function getGenericVideosDirectory(): string {
  return getUploadsDirectory('videos');
}

export function ensureGenericVideosDirectory(): string {
  return ensureUploadsDirectory('videos');
}

export function getGenericDocumentsDirectory(): string {
  return getUploadsDirectory('documents');
}

export function ensureGenericDocumentsDirectory(): string {
  return ensureUploadsDirectory('documents');
}

export function getUploadWebPath(...segments: string[]): string {
  const relativePath = assertSafeUploadRelativePath(
    segments.map((segment) => normalizeSlashes(segment)).join('/'),
  );
  return `${UPLOADS_WEB_PREFIX}/${relativePath}`;
}

export function getPostImageWebPath(filename: string): string {
  return getUploadWebPath('posts', 'images', filename);
}

export function getPostVideoWebPath(filename: string): string {
  return getUploadWebPath('posts', 'videos', filename);
}

export function getCarouselImageWebPath(filename: string): string {
  return getUploadWebPath('carousels', filename);
}

export function getGenericImageWebPath(filename: string): string {
  return getUploadWebPath('images', filename);
}

export function getGenericVideoWebPath(filename: string): string {
  return getUploadWebPath('videos', filename);
}

export function getGenericDocumentWebPath(filename: string): string {
  return getUploadWebPath('documents', filename);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+/g, '/');
}

function stripQueryAndHash(value: string): string {
  return value.split(/[?#]/, 1)[0];
}

function stripUploadPrefix(value: string): string {
  let relativePath = normalizeSlashes(value.trim());

  relativePath = stripQueryAndHash(relativePath);
  relativePath = relativePath.replace(/^\.\/+/, '');
  relativePath = relativePath.replace(/^\/+/, '');

  if (relativePath === 'api') return '';
  if (relativePath.startsWith('api/')) {
    relativePath = relativePath.slice('api/'.length);
  }

  while (relativePath === 'uploads' || relativePath.startsWith('uploads/')) {
    relativePath =
      relativePath === 'uploads'
        ? ''
        : relativePath.slice('uploads/'.length);
  }

  return relativePath;
}

function hasUploadPathPrefix(value: string): boolean {
  const normalizedPath = normalizeSlashes(stripQueryAndHash(value.trim()))
    .replace(/^\/+/, '');

  return (
    normalizedPath === 'uploads' ||
    normalizedPath.startsWith('uploads/') ||
    normalizedPath === 'api/uploads' ||
    normalizedPath.startsWith('api/uploads/')
  );
}

function assertSafeUploadRelativePath(relativePath: string): string {
  const pathSegments = relativePath.split('/').filter(Boolean);

  if (
    relativePath.includes('\0') ||
    pathSegments.length === 0 ||
    pathSegments.some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error('Unsafe upload path');
  }

  const normalized = path.posix.normalize(pathSegments.join('/'));
  if (
    normalized === '.' ||
    normalized.startsWith('../') ||
    normalized === '..' ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error('Unsafe upload path');
  }

  return normalized;
}

export function getUploadRelativePath(value?: string | null): string | null {
  const rawValue = value?.trim();
  if (!rawValue) return null;

  const parsedUrl = parseUrl(rawValue);
  if (parsedUrl) {
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('Unsupported upload URL protocol');
    }

    if (!hasUploadPathPrefix(parsedUrl.pathname)) return null;

    const relativeUrlPath = stripUploadPrefix(parsedUrl.pathname);
    if (!relativeUrlPath) return null;
    return assertSafeUploadRelativePath(relativeUrlPath);
  }

  const relativePath = stripUploadPrefix(rawValue);
  if (!relativePath) return null;
  return assertSafeUploadRelativePath(relativePath);
}

export function normalizeStoredMediaPath(value?: string | null): string {
  const rawValue = value?.trim();
  if (!rawValue) return '';

  const parsedUrl = parseUrl(rawValue);
  if (parsedUrl) {
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('Unsupported media URL protocol');
    }

    const relativePath = getUploadRelativePath(rawValue);
    if (relativePath) {
      parsedUrl.pathname = `${UPLOADS_WEB_PREFIX}/${relativePath}`;
      parsedUrl.search = '';
      parsedUrl.hash = '';
      return parsedUrl.toString();
    }

    return parsedUrl.toString();
  }

  const relativePath = getUploadRelativePath(rawValue);
  return relativePath ? `${UPLOADS_WEB_PREFIX}/${relativePath}` : '';
}

export function normalizeStoredMediaPathForResponse(
  value?: string | null,
): string {
  try {
    return normalizeStoredMediaPath(value);
  } catch {
    return '';
  }
}

function isPathInsideDirectory(targetPath: string, directoryPath: string): boolean {
  const relativePath = path.relative(directoryPath, targetPath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  );
}

export function resolveUploadFilePath(value?: string | null): string | null {
  const relativePath = getUploadRelativePath(value);
  if (!relativePath) return null;

  const uploadsRoot = getUploadsRoot();
  const resolvedPath = path.resolve(uploadsRoot, relativePath);
  if (!isPathInsideDirectory(resolvedPath, uploadsRoot)) {
    throw new Error('Resolved upload path is outside the uploads root');
  }

  return resolvedPath;
}

export function deleteUploadFileIfExists(value?: string | null): boolean {
  const filePath = resolveUploadFilePath(value);
  if (!filePath || !fs.existsSync(filePath)) return false;

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) return false;

  fs.unlinkSync(filePath);
  return true;
}
