import type { KaiosNavigator } from "../../types/dom";

export function getFeature(name: string): Promise<any> {
  if ('getFeature' in navigator) {
    const kaiosNavigator = (navigator as KaiosNavigator);
    return kaiosNavigator.getFeature(name);
  }

  return Promise.resolve(null);
}

export function hasFeature(name: string): Promise<any> {
  if ('hasFeature' in navigator) {
    const kaiosNavigator = (navigator as KaiosNavigator);
    return kaiosNavigator.hasFeature(name);
  }

  return Promise.resolve(null);
}
