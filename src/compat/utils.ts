import type { KaiosNavigator } from "../../types/dom";

export function minimizeMemoryUsage() {
  const kaiosNavigator = (navigator as KaiosNavigator);
  if ('minimizeMemoryUsage' in kaiosNavigator) {
    kaiosNavigator.minimizeMemoryUsage();
  }
}
