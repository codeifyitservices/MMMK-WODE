const LIVE_UPLOADS_URL = 'https://mmmk-wode.com/uploads';

const ASSET_BASE_URL = (
  import.meta.env.VITE_IMAGE_URL ||
  import.meta.env.VITE_PUBLIC_UPLOAD_BASE_URL ||
  LIVE_UPLOADS_URL
).replace(/\/$/, '');

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
      const isLocalHost =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local');

      // If an absolute URL points to a local uploads server, redirect to live assets
      if (isLocalHost && parsedUrl.pathname.includes('/uploads/')) {
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

  // The production upload store does not host pre-generated thumb-*.webp files.
  // Directly resolving the actual asset prevents 404 network errors and avoids image load delays.
  return resolveAssetUrl(value);
};
