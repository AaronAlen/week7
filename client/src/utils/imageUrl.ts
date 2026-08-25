/**
 * Resolves full URL for product images with TypeScript typing.
 */
export const getImageUrl = (imagePath?: string | null): string | null => {
  if (!imagePath) return null;
  
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }

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
