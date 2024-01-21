import { PUBLISHER_ID } from '../Static';

export type CallType = 'display';

export interface CallOptions {
  tabindex?: number;
  navClass?: string;
  display?: string;
}

export interface Kaiad {
  call(name: CallType, options?: CallOptions): void;
  on(name: string, callback: () => any): void;
}

export function getAd(test: boolean = false): Promise<Kaiad> {
  return new Promise((resolve, reject) => {
    if (typeof window['getKaiAd'] === 'function') {
      window['getKaiAd']({
        publisher: PUBLISHER_ID,
        app: 'fliptv',
        slot: 'main',
        test: Number(test),
        onerror: () => reject(null),
        onready: (ad: Kaiad) => resolve(ad),
      });
    } else {
      return reject(null);
    }
  });
}
