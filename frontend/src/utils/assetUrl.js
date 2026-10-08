const DEPLOYED_UPLOADS_BASE_URL =
  import.meta.env.VITE_PUBLIC_UPLOAD_BASE_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/uploads` : '');
const ASSET_BASE_URL = (
  import.meta.env.VITE_IMAGE_URL ||
  DEPLOYED_UPLOADS_BASE_URL ||
  ''
).replace(/\/$/, '');

const isLocalEnv =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.endsWith('.local'));

const shouldRewriteAbsoluteUrl = (value) => {
  // Don't rewrite local URLs to production if we are currently developing locally
  if (isLocalEnv) return false;

  try {
    const parsedUrl = new URL(value);
    const host = parsedUrl.hostname.toLowerCase();

    return (
      parsedUrl.pathname.includes('/uploads/') &&
      (host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local'))
    );
  } catch {
    return false;
  }
};

export const isAbsoluteAssetUrl = (value = '') =>
  /^(?:https?:)?\/\//i.test(value) ||
  value.startsWith('data:') ||
  value.startsWith('blob:');

export const resolveAssetUrl = (value = '') => {
  if (!value) return '';
  
  // If it's already an absolute URL (http, https, data, blob)
  if (isAbsoluteAssetUrl(value)) {
    // But if it's a local absolute URL and we are in production, rewrite it
    if (shouldRewriteAbsoluteUrl(value)) {
      const filename = String(value)
        .split('/uploads/')
        .pop()
        ?.replace(/^\/+/, '');

      return filename
        ? `${DEPLOYED_UPLOADS_BASE_URL.replace(/\/$/, '')}/${filename}`
        : value;
    }

    return value;
  }

  // Handle local filenames and redundant 'uploads/' prefix
  let filename = String(value).replace(/^\/+/, '');
  if (filename.startsWith('uploads/')) {
    filename = filename.replace(/^uploads\//, '');
  }

  if (ASSET_BASE_URL) {
    return `${ASSET_BASE_URL.replace(/\/$/, '')}/${filename}`;
  }

  // Fallback for local development if ASSET_BASE_URL is missing
  if (isLocalEnv) {
    return `http://localhost:3001/uploads/${filename}`;
  }

  return `${DEPLOYED_UPLOADS_BASE_URL.replace(/\/$/, '')}/${filename}`;
};

const getFileNameFromAsset = (value = '') => {
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

export const getThumbnailAssetUrl = (value = '') => {
  const fileName = getFileNameFromAsset(value);
  if (!fileName) return '';
  if (fileName.startsWith('thumb-')) {
    return resolveAssetUrl(fileName);
  }

  const baseName = fileName.replace(/\.[^.]+$/, '');
  return resolveAssetUrl(`thumb-${baseName}.webp`);
};
