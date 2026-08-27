/**
 * Resolves full URL for product images.
 * If the image is a full URL (e.g. Cloudinary https://res.cloudinary.com/...) or data URL, it returns it directly.
 * If it's a relative path (e.g. /uploads/product-123.png), it prefixes it with the backend server origin.
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';
  
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }

  // Get backend base URL from VITE_SOCKET_URL or VITE_API_URL
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  let backendBase = '';

  if (socketUrl && socketUrl !== '/api') {
    backendBase = socketUrl.replace(/\/+$/, '');
  } else if (apiUrl && apiUrl !== '/api') {
    backendBase = apiUrl.replace(/\/api\/?$/, '');
  }

  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return backendBase ? `${backendBase}${cleanPath}` : cleanPath;
};
