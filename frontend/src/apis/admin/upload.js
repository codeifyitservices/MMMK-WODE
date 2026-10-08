import { createAdminApiClient } from './client';
import { appendCompressedImages } from '../../utils/imageCompression';

const SHARED_UPLOAD_BASE_URL = (
  import.meta.env.VITE_SHARED_UPLOAD_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/$/, '');

const uploadApi = createAdminApiClient(
  `${SHARED_UPLOAD_BASE_URL}/api/v1/admin/upload`,
  30000
);

export const uploadAdminFiles = async (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const formData = new FormData();
  await appendCompressedImages(formData, 'files', files);

  const response = await uploadApi.post('/images', formData);
  return response?.data?.data?.files || [];
};

export const uploadSingleAdminFile = async (file) => {
  const [uploadedFile] = await uploadAdminFiles(file ? [file] : []);
  return uploadedFile || null;
};
