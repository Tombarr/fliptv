import type { KaiosDocument, KaiosHTMLElement } from "../../types/dom";

// @return [Promise] True if the app has entered full screen
export function requestFullscreen(el: HTMLElement = document.documentElement) {
  if (!el) {
    return Promise.resolve(false);
  }

  const kaiosEl = (el as KaiosHTMLElement);
  try {
    if (el.requestFullscreen) {
      return el.requestFullscreen() || Promise.resolve(undefined);
    } else if (kaiosEl.webkitRequestFullscreen) {
      return kaiosEl.webkitRequestFullscreen() || Promise.resolve(undefined);
    } else if (kaiosEl.mozRequestFullScreen) {
      return kaiosEl.mozRequestFullScreen() || Promise.resolve(undefined);
    } else if (kaiosEl.msRequestFullscreen) {
      return kaiosEl.msRequestFullscreen() || Promise.resolve(undefined);
    }
  } catch (e) {
    console.warn('Cannot enter full screen.', e);
  }

  return Promise.resolve(false);
}

// @returns [Promise] True if the app has exited full screen
export function exitFullscreen() {
  const kaiosDocument = (document as KaiosDocument);
  try {
    if (document.exitFullscreen) {
      return document.exitFullscreen() || Promise.resolve(undefined);
    } else if (kaiosDocument.webkitExitFullscreen) {
      return kaiosDocument.webkitExitFullscreen() || Promise.resolve(undefined);
    } else if (kaiosDocument.mozCancelFullScreen) {
      return kaiosDocument.mozCancelFullScreen() || Promise.resolve(undefined);
    } else if (kaiosDocument.msExitFullscreen) {
      return kaiosDocument.msExitFullscreen() || Promise.resolve(undefined);
    }
  } catch (e) {
    console.warn('Cannot exit full screen.', e);
  }

  return Promise.resolve(false);
}

// @returns [Boolean] True if the app is currently full screen
export function isFullscreen() {
  const kaiosDocument = (document as KaiosDocument);
  if ('fullscreenElement' in document) {
    return Boolean(document.fullscreenElement);
  } else if ('webkitFullscreenElement' in document) {
    return Boolean(kaiosDocument.webkitFullscreenElement);
  } else if ('mozFullScreenElement' in document) {
    return Boolean(kaiosDocument.mozFullScreenElement);
  } else if ('msFullScreenElement' in document) {
    return Boolean(kaiosDocument.msFullscreenElement);
  }

  return false;
}

let eventName, errorName; 

const kaiosDocument = (document as KaiosDocument);
if (typeof document.exitFullscreen !== "undefined") {
  eventName = "fullscreenchange";
  errorName = "fullscreenerror";
} else if (typeof kaiosDocument.webkitExitFullscreen !== "undefined") {
  eventName = "webkitfullscreenchange";
  errorName = "webkitfullscreenerror";
} else if (typeof kaiosDocument.mozCancelFullScreen !== "undefined") {
  eventName = "mozfullscreenchange";
  errorName = "mozfullscreenerror";
} else if (typeof kaiosDocument.msExitFullscreen !== "undefined") {
  eventName = "MSFullscreenChange";
  errorName = " MSFullscreenError";
}

export const FULLSCREENCHANGE = eventName;
export const FULLSCREENERROR = errorName;
