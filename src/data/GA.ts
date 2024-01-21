import { getUuid } from './UUID';
import { random } from '../compat/random';
import { NAME, VERSION, TRACKING_ID, APP_ID } from '../Static';

const collect = 'https://www.google-analytics.com/collect';

const b = (v: boolean) => (v) ? 1 : 0;
const n = (minm = 10000000000, maxm = 99999999999) => Math.floor(random() * (maxm - minm + 1)) + minm; 
const j = () => b((navigator.javaEnabled) ? navigator.javaEnabled() : false);
const cs = () => (document.characterSet || document.charset || document.inputEncoding || '');
const ds = () => ((location.protocol.startsWith('app')) ? 'app' : 'web');

const RESOLUTION = (typeof window === 'object') ? [
  window.screen.width * (window.devicePixelRatio || 1),
  window.screen.height * (window.devicePixelRatio || 1),
].map((n) => Math.floor(n)) : [0, 0];

export const HIT_TYPES = Object.seal(['pageview', 'screenview', 'event', 'transaction', 'item', 'social', 'exception', 'timing']);

const validParam = (p: any) => !(p === undefined || p === null || p === '' || Number.isNaN(p));

function getLanguage() {
  return (
    navigator.language ||
    ((Array.isArray(navigator.languages)) ? navigator.languages[0] : null) ||
    'en-US'
  );
}

function toURL(base: string, map: Map<string, any>) {
  // Create Pixel URL
  const url = new URL(base);

  Array.from(map.entries()).forEach((entry) => {
    if (validParam(entry[0]) && entry[1]) {
      url.searchParams.append(entry[0], entry[1]);
    }
  });

  return url.toString();
}

function measurementUrlData(documentPath: string, hitType: string) {
  try {
    // Gather Tracking Data
    return new Map([
      ['v', 1], // Version
      ['tid', TRACKING_ID], // Tracking ID
      ['cid', getUuid()], // Customer ID
      ['t', hitType], // Hit Type
      ['aip', 1], // Anonymize IP
      ['npa', 1], // Disable Ad Personalization
      ['ds', ds()], // Data Source
      ['dr', document.referrer], // Referrer
      ['sr', RESOLUTION.join('x')], // Screen resolution
      ['de', cs()], // Document Encoding
      ['sd', `${window.screen.colorDepth}-bit`], // Screen Color Depth
      ['ul', getLanguage()], // User Language
      ['je', j()], // Java Enabled
      ['dh', document.location.host], // Document Host
      ['dp', documentPath], // Document Path
      ['dt', document.title],
      ['an', NAME], // App Name
      ['aid', APP_ID], // App ID
      ['av', VERSION], // App Version
      ['z', n()], // Random Number (cache busting)
    ]);
  } catch (_) {
    return null;
  }
}

// Google Analytics Measurement Protocol
// https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
export function measurementUrl(dp = document.location.pathname, ht = 'pageview') {
  try {
    const data = measurementUrlData(dp, ht);
    return toURL(collect, data);
  } catch (_) {
    return '';
  }
}

// GA Events
export function eventUrl({ category, action, label, value }) {
  try {
    const data = measurementUrlData(document.location.pathname, 'event');
    data.set('ec', category);
    data.set('ea', action);
    data.set('el', label);
    data.set('ev', value);
    return toURL(collect, data);
  } catch (_) {
    return '';
  }
}
