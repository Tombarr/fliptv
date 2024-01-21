import 'wicg-mediasession';

const supportsMediaSession = (
  typeof window === 'object' &&
  'mediaSession' in navigator &&
  'MediaMetadata' in window
);

const supportsPlaybackState = (
  typeof window === 'object' &&
  'mediaSession' in navigator &&
  'MediaMetadata' in window &&
  'playbackState' in navigator.mediaSession
);

const ARTWORK_SIZES = [96, 128, 192, 256, 384, 512];
const IMAGE_MIME_TYPES = new Map([
  ['.bmp', 'image/bmp'],
  ['.gif', 'image/gif'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.tiff', 'image/tiff'],
  ['.webp', 'image/webp']
]);

// @returns [String] Guess at image MIME type, based on presumed file extension
function inferMimeType(url: string) {
  const lUrl = url.toLowerCase();
  const mimeType = Array.from(IMAGE_MIME_TYPES.entries())
    .find(([ext]) => lUrl.includes(ext));
  return (mimeType) ? mimeType[1] : '';
}

// @returns [Array<Object>] List of image artworks, compatible with Chrome
function makeArtworkSizes(src: string): Array<MediaImage> {
  const type = inferMimeType(src);
  return ARTWORK_SIZES.map((s) => ({
    sizes: `${s}x${s}`,
    type,
    src,
  }));
}

export interface SimpleMediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
}

// @returns [Boolean] True if MediaSession Metadata was set successfully
export function setMetadata(metadata: SimpleMediaMetadata): boolean {
  if (!supportsMediaSession) { return false; }

  if (!(metadata === null || metadata === undefined) && typeof metadata === 'object') {
    const { title, artist, album, artwork } = metadata;
    navigator.mediaSession.metadata = new MediaMetadata({
      title, artist, album, artwork: (artwork) ? makeArtworkSizes(artwork) : [],
    });
  } else {
    navigator.mediaSession.metadata = null;
  }

  return true;
}

export function setActionHandler(type: MediaSessionAction, callback: () => any): boolean {
  if (!supportsMediaSession) { return false; }

  try {
    navigator.mediaSession.setActionHandler(type, callback);
    return true;
  } catch (e) {
    console.warn(`The media session action "${type}" is not supported yet.`, e);
    return false;
  }
}

export function setMultiActionHandler(callback: () => any, actions: Array<MediaSessionAction>): boolean {
  if (!supportsMediaSession) { return false; }

  return actions.map((type) => setActionHandler(type, callback)).some(Boolean);
}

export function setPlaybackState(state: MediaSessionPlaybackState): boolean {
  if (!supportsPlaybackState) { return false; }

  navigator.mediaSession.playbackState = state;
  return true;
}

export function getPlaybackState(): MediaSessionPlaybackState {
  if (!supportsPlaybackState) { return 'none'; }

  return navigator.mediaSession.playbackState;
}

export function getMetadata(): MediaMetadata {
  if (!supportsMediaSession) { return null; }

  return navigator.mediaSession.metadata;
}
