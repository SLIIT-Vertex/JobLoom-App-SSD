import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Upload a single file via the backend's Cloudinary-backed endpoint.
 * Backend route: POST /api/upload (multipart/form-data, field: file)
 * @param {{file: File, folder?: string}} params
 * @returns {Promise<{url: string, public_id: string, resource_type: string}>}
 */
export async function uploadFile({ file, folder }) {
  if (!file) throw new Error('No file provided');

  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message || 'Upload failed');
    }

    return data;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Upload timed out. Please try again.');
    }
    if (err instanceof TypeError && /failed to fetch/i.test(err.message)) {
      throw new Error('Upload failed: network/CORS issue or backend is unreachable.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get a short-lived signed URL for downloading/viewing a Cloudinary asset.
 * Backend route: GET /api/upload/signed-url
 *
 * Prefer passing `url` (existing Cloudinary URL) if you don't have `publicId`.
 * @param {{publicId?: string, format?: string, resourceType?: string, deliveryType?: string, url?: string, attachment?: boolean, expiresIn?: number}} params
 * @returns {Promise<string>} signedUrl
 */
export async function getSignedDownloadUrl({
  publicId,
  format,
  resourceType,
  deliveryType,
  url,
  attachment = false,
  expiresIn,
}) {
  const response = await api.get('/upload/signed-url', {
    params: {
      public_id: publicId,
      format,
      resource_type: resourceType,
      type: deliveryType,
      url,
      attachment,
      expiresIn,
    },
  });

  return response.data?.url;
}
