import type { KaiosScreen } from "../../types/dom";

export type Orientation = 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';

export function getOrientation(): OrientationLockType {
  const kaiosScreen = (screen as KaiosScreen);
  return (
    (kaiosScreen.orientation || {}).type ||
    kaiosScreen.mozOrientation ||
    kaiosScreen.msOrientation ||
    ((window.innerHeight > window.innerWidth) ? 'portrait-primary' : 'landscape-primary')
  );
}

const noop = () => false;

const kaiosScreen = (screen as KaiosScreen);
const lockOrientationUniversal = (
  kaiosScreen.lockOrientation ||
  kaiosScreen.mozLockOrientation ||
  kaiosScreen.msLockOrientation ||
  (kaiosScreen.orientation) ? kaiosScreen.orientation.lock.bind(kaiosScreen.orientation) : noop ||
  noop
);

const unlockOrientationUniversal = (
  kaiosScreen.unlockOrientation ||
  kaiosScreen.mozUnlockOrientation ||
  kaiosScreen.msUnlockOrientation ||
  (kaiosScreen.orientation) ? kaiosScreen.orientation.unlock.bind(kaiosScreen.orientation) : noop ||
  noop
);

// @returns [Boolean] True if the device's orientation was successfully (un)locked
export function lockOrientation(lock: boolean = true, type: OrientationLockType = 'natural'): boolean {
  if (lock) {
    return lockOrientationUniversal(type);
  }

  return unlockOrientationUniversal();
}
