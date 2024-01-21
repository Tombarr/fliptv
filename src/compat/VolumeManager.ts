import type { KaiosNavigator } from "../../types/dom";

export const hasVolumeManager = (
  typeof window === 'object'
  && window.navigator
  && ('volumeManager' in navigator)
);

// From gaia sound manager
const HIDE_SOUND_DELAY = 2 * 1000; // 2s
let volumeManagerTimer = null;
let volumePanelListener = null;
let activeElement = null;

const arrowMap = new Map<string, Function>([
  ['ArrowUp', requestUp],
  ['ArrowDown', requestDown],
]);

// Handle app-wide key events
export function onVolumeKeyDown(e: KeyboardEvent) {
  // Map d-pad arrow keys
  if (volumeManagerTimer !== null) {
    if (arrowMap.has(e.key) && arrowMap.get(e.key)()) {
      e.preventDefault();
    }
  }
}

function enterVolumeManagerMode() {
  if (volumeManagerTimer !== null) {
    exitVolumeManagerMode(true);
  } else {
    if (volumePanelListener) {
      volumePanelListener(true);
    }

    activeElement = document.activeElement;
  }

  volumeManagerTimer = setTimeout(exitVolumeManagerMode, HIDE_SOUND_DELAY);
}

function exitVolumeManagerMode(clear = false) {
  window.clearTimeout(volumeManagerTimer);
  volumeManagerTimer = null;

  if (clear === false) {
    if (volumePanelListener) {
      volumePanelListener(false);
    }

    if (activeElement) {
      activeElement.focus();
      activeElement.classList.add('focused');
      activeElement = null;
    }
  }
}

export function requestUp() {
  if (hasVolumeManager) {
    enterVolumeManagerMode();
    (navigator as KaiosNavigator).volumeManager.requestUp();
    return true;
  }

  return false;
}

export function requestDown() {
  if (hasVolumeManager) {
    enterVolumeManagerMode();
    (navigator as KaiosNavigator).volumeManager.requestDown();
    return true;
  }

  return false;
}

export function requestShow() {
  if (hasVolumeManager) {
    enterVolumeManagerMode();
    (navigator as KaiosNavigator).volumeManager.requestShow();
    return true;
  }

  return false;
}

export function changeVolume(direction: number) {
  if (direction > 0) {
    return requestUp();
  } else {
    return requestDown();
  }
}

export function setVolumePanelListener(fn = null) {
  if (fn === null) {
    volumePanelListener = null;
  } else if (fn instanceof Function) {
    volumePanelListener = fn;
  }
}
