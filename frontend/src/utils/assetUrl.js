const LIVE_UPLOADS_URL = 'https://mmmk-wode.com/uploads';

const ASSET_BASE_URL = (
  import.meta.env.VITE_IMAGE_URL ||
  import.meta.env.VITE_PUBLIC_UPLOAD_BASE_URL ||
  LIVE_UPLOADS_URL
).replace(/\/$/, '');

const BACKEND_UPLOADS_URL = `${(
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_SHARED_UPLOAD_BASE_URL ||
  'http://localhost:3001'
).replace(/\/$/, '')}/uploads`;

export const DEFAULT_FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><path d="M30 65 L45 45 L55 58 L65 42 L80 65 Z" fill="%23d1d5db"/><circle cx="40" cy="35" r="6" fill="%23d1d5db"/></svg>';

export const isLocalEnvironment = () => {
  if (typeof window === 'undefined') {
    return Boolean(import.meta.env.DEV);
  }
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    Boolean(import.meta.env.DEV)
  );
};

export const isAbsoluteAssetUrl = (value = '') =>
  /^(?:https?:)?\/\//i.test(value) ||
  value.startsWith('data:') ||
  value.startsWith('blob:');

export const resolveAssetUrl = (value = '') => {
  if (!value) return '';

  // If it's already an absolute URL (http, https, data, blob)
  if (isAbsoluteAssetUrl(value)) {
    try {
      const parsedUrl = new URL(value);
      const host = parsedUrl.hostname.toLowerCase();
      const isLegacyStagingHost = host.includes('codenap.in');
      const isLocalHost =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local');

      // If pointing to old codenap staging uploads, redirect to live assets
      if (isLegacyStagingHost && parsedUrl.pathname.includes('/uploads/')) {
        const filename = parsedUrl.pathname.split('/uploads/').pop()?.replace(/^\/+/, '');
        return filename ? `${ASSET_BASE_URL}/${filename}` : value;
      }

      // If pointing to a localhost upload and running in production, redirect to live assets
      if (isLocalHost && !isLocalEnvironment() && parsedUrl.pathname.includes('/uploads/')) {
        const filename = parsedUrl.pathname.split('/uploads/').pop()?.replace(/^\/+/, '');
        return filename ? `${ASSET_BASE_URL}/${filename}` : value;
      }
    } catch {
      // not a valid URL, return as is
    }

    return value;
  }

  // Handle local filenames and redundant 'uploads/' prefix
  let filename = String(value).replace(/^\/+/, '');
  if (filename.startsWith('uploads/')) {
    filename = filename.replace(/^uploads\//, '');
  }

  return `${ASSET_BASE_URL}/${filename}`;
};

export const getFileNameFromAsset = (value = '') => {
  if (!value) return '';

  if (isAbsoluteAssetUrl(value)) {
    try {
      return new URL(value).pathname.split('/').pop() || '';
    } catch {
      return '';
    }
  }

  return String(value).replace(/^\/+/, '').split('/').pop() || '';
};

export const getAssetFallbackUrl = (value = '') => {
  const filename = getFileNameFromAsset(value);
  if (!filename) return DEFAULT_FALLBACK_IMAGE;

  // Fall back to active backend /uploads (e.g. Render in production or localhost in dev)
  // whenever primary CDN resolution does not point to it
  if (BACKEND_UPLOADS_URL && !ASSET_BASE_URL.startsWith(BACKEND_UPLOADS_URL)) {
    return `${BACKEND_UPLOADS_URL}/${filename}`;
  }

  return DEFAULT_FALLBACK_IMAGE;
};

export const getThumbnailAssetUrl = (value = '') => {
  const fileName = getFileNameFromAsset(value);
  if (!fileName) return '';
  if (fileName.startsWith('thumb-')) {
    return resolveAssetUrl(fileName);
  }

  // The production upload store does not host pre-generated thumb-*.webp files.
  // Directly resolving the actual asset prevents 404 network errors and avoids image load delays.
  return resolveAssetUrl(value);
};
