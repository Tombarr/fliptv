import { version } from '../package.json';

export const NAME = 'FlipTV';
export const VERSION = version;
export const TRACKING_ID = ''; // TODO: move to GAv4
export const APP_ID = 'kaios.app.fliptv';

export const PUBLISHER_ID = ''; // TODO: KaiAds
export const AD_INTERVAL: number = 5 * 60 * 1000; // 5min
export const CONTROLS_DURATION: number = 5 * 1000; // 5s

export const HLS_CONFIG = Object.freeze({
  capLevelToPlayerSize: true,
  capLevelOnFPSDrop: true,
  backBufferLength: 0,
  maxBufferSize: 20 * 1000 * 1000, // 20 MB
  maxBufferLength: 20, // 20s
  maxMaxBufferLength: 30, // 30s
  startLevel: 1,
  progressive: false, // Prefer XHR to avoid CORS
  startFragPrefetch: true,
  enableWorker: false,
  liveDurationInfinity: true,
  xhrSetup: (xhr: XMLHttpRequest) => {
    // Avoid cache or cookies
    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, max-age=0');
    xhr.setRequestHeader('Expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.withCredentials = false;
    xhr.timeout = 10 * 1000; // 10s
  },
});
