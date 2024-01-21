import type { DOMRequest, App, KaiosNavigator } from '../../types/dom';

const CHECK_FOR_UPDATES = Boolean(
  typeof window === 'object' &&
  window.navigator &&
  typeof window.navigator['mozApps'] === 'function'
);

export const hasMozActivity = Boolean(
  typeof window === 'object' &&
  'MozActivity' in window
);

// Checks if an update is available
export function isUpdateAvailable(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!CHECK_FOR_UPDATES) {
      return resolve(false);
    }

    const request: DOMRequest = window.navigator['mozApps'].getSelf();
    request.onsuccess = () => {
      const app: App = request.result;
      const updateRequest = app.checkForUpdate();
      updateRequest.onsuccess = () => resolve(app.downloadAvailable);
      updateRequest.onerror = () => {
        // Side-loaded or installed outside of KaiStore/ JioStore
        if (updateRequest.error && updateRequest.error.name === 'NOT_UPDATABLE') {
          return resolve(false);
        }

        reject(updateRequest.error);
      };
    };
    request.onerror = () => reject(request.error);
  });
}

export function openAppPromise(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!hasMozActivity || url === null || url === undefined || url.length === 0) {
      return resolve(false);
    }
    
    const request: DOMRequest = new window.MozActivity({
      name: 'open-page',
      data: {
        type: 'url',
        url,
      },
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Launches the app details page on KaiStore or JioStore
export function goToStore(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!CHECK_FOR_UPDATES) {
      return resolve(false);
    }

    const kaiosNavigator = (navigator as KaiosNavigator);
    const request: DOMRequest = kaiosNavigator.mozApps.getSelf();
    request.onsuccess = () => {
      const app: App = request.result;
      openAppPromise(app.manifestURL)
        .then(resolve)
        .catch(reject);
    };
    request.onerror = () => reject(request.error);
  });
}