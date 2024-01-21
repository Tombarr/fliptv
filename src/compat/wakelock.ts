import type { KaiosNavigator, MozWakeLock, WakeLockTopic } from "../../types/dom";

const locks = new Map<string, MozWakeLock>();

export function requestWakeLock(topic: WakeLockTopic): MozWakeLock {
  if (locks.has(topic)) {
    return locks.get(topic);
  }

  const kaiosNavigator = (navigator as KaiosNavigator);
  if (typeof kaiosNavigator.requestWakeLock === 'function') {
    const lock: MozWakeLock = kaiosNavigator.requestWakeLock(topic);
    locks.set(topic, lock);
    return lock;
  }

  return null;
}

export function releaseWakeLock(topic: WakeLockTopic) {
  if (locks.has(topic)) {
    const lock = locks.get(topic);
    locks.delete(topic);
    lock.unlock();
  }
}
