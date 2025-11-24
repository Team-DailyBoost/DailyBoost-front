/**
 * Provides a tiny 1x1 transparent PNG for endpoints that require MultipartFile.
 * The backend's /api/user/update endpoint requires the `file` part even when
 * the user is only updating textual fields, so we attach this placeholder to
 * avoid 400/500 responses.
 */
export const TRANSPARENT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

export function buildPlaceholderImage() {
  return {
    data: TRANSPARENT_PNG_BASE64,
    name: `placeholder-${Date.now()}.png`,
    type: 'image/png',
  };
}

