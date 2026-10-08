export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_COMPRESSION_ATTEMPTS = 8;

const IMAGE_TYPES_TO_COMPRESS = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const getCompressionMimeType = (file) => {
  if (!file?.type) return 'image/jpeg';

  if (file.type === 'image/png' || file.type === 'image/webp') {
    return 'image/webp';
  }

  if (file.type === 'image/gif') {
    return 'image/webp';
  }

  return 'image/jpeg';
};

const getCompressedFileName = (file, mimeType) => {
  const baseName = (file?.name || 'image').replace(/\.[^/.]+$/, '');
  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `${baseName}.${extension}`;
};

const loadImageBitmap = async (file) => {
  if (typeof createImageBitmap !== 'function') {
    return null;
  }

  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
};

const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error(`Failed to read image ${file?.name || ''}`.trim()));
    };

    image.src = imageUrl;
  });

const loadImageSource = async (file) => {
  const bitmap = await loadImageBitmap(file);

  if (bitmap) {
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const image = await loadImageElement(file);
  return {
    source: image,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    cleanup: () => {},
  };
};

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('Failed to compress image'));
      },
      mimeType,
      quality
    );
  });

export const compressImageFile = async (
  file,
  maxBytes = MAX_IMAGE_UPLOAD_SIZE_BYTES
) => {
  if (!(file instanceof File)) return file;
  if (!file.type.startsWith('image/')) return file;
  if (!IMAGE_TYPES_TO_COMPRESS.has(file.type)) return file;
  if (file.size <= maxBytes) return file;

  const mimeType = getCompressionMimeType(file);
  const initialQuality = mimeType === 'image/jpeg' ? 0.86 : 0.9;
  const minQuality = mimeType === 'image/jpeg' ? 0.52 : 0.6;
  const downscaleRatio = Math.min(1, Math.sqrt(maxBytes / file.size) * 1.1);
  const image = await loadImageSource(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', {
    alpha: mimeType !== 'image/jpeg',
    willReadFrequently: false,
  });

  if (!context) {
    image.cleanup();
    return file;
  }

  let width = Math.max(1, Math.round(image.width * downscaleRatio));
  let height = Math.max(1, Math.round(image.height * downscaleRatio));
  let quality = initialQuality;
  let bestBlob = null;

  try {
    for (let attempt = 0; attempt < MAX_COMPRESSION_ATTEMPTS; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image.source, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, mimeType, quality);

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      if (blob.size <= maxBytes) {
        return new File([blob], getCompressedFileName(file, mimeType), {
          type: mimeType,
          lastModified: Date.now(),
        });
      }

      const sizeRatio = Math.sqrt(maxBytes / blob.size);
      const nextScale = Math.max(0.7, Math.min(0.92, sizeRatio * 0.98));

      if (quality > minQuality) {
        quality = Math.max(minQuality, quality - 0.08);
      } else {
        width = Math.max(1, Math.round(width * nextScale));
        height = Math.max(1, Math.round(height * nextScale));
        quality = Math.min(initialQuality, quality + 0.02);
      }
    }
  } finally {
    image.cleanup();
  }

  return new File([bestBlob], getCompressedFileName(file, mimeType), {
    type: mimeType,
    lastModified: Date.now(),
  });
};

export const appendCompressedImage = async (formData, fieldName, file) => {
  const sourceFile = file?.originFileObj || file;
  if (!(sourceFile instanceof File)) return;

  const compressedFile = await compressImageFile(sourceFile);
  formData.append(fieldName, compressedFile);
};

export const appendCompressedImages = async (formData, fieldName, files) => {
  if (!Array.isArray(files)) return;

  const compressedFiles = await Promise.all(
    files.map(async (file) => {
      const sourceFile = file?.originFileObj || file;
      if (!(sourceFile instanceof File)) return null;

      return compressImageFile(sourceFile);
    })
  );

  for (const compressedFile of compressedFiles) {
    if (compressedFile) {
      formData.append(fieldName, compressedFile);
    }
  }
};
