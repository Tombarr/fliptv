import type { KaiosNavigator } from "../../types/dom";

const DEFAULT_TIMEOUT = 10 * 1000;

// @returns [Promise<Boolean|null>] True if a given host is reachable
export function isHostReachable(host: URL | string, timeout = DEFAULT_TIMEOUT): Promise<boolean | null> {
  return new Promise((resolve) => {
    if (!('mozTCPSocket' in navigator)) {
      return null;
    }

    let isResolved = false;
    const kaiosNavigator = (navigator as KaiosNavigator);
    const secure = (host.toString().toLowerCase().startsWith('https'));
    const port = (host instanceof URL) ? Number.parseInt(host.port, 10) : (secure) ? 443 : 80;
    
    const socket = kaiosNavigator.mozTCPSocket
      .open(host.toString(), port, { useSecureTransport: secure });

    // Closes socket, if open, and resolves Promise
    const closeAndResolve = (success: boolean) => {
      if (socket.readyState !== 'closed') {
        try {
          socket.close();
        } catch (e) {
          console.warn(e);
        }
      }

      isResolved = true;
      return resolve(success);
    };

    // Set socket timeout
    setTimeout(() => {
      if (!isResolved) {
        closeAndResolve(false);
      }
    }, timeout);

    // Expected error: message = 'Network' and name = 'ConnectionRefusedError'
    // Error message include:
    // - SecurityProtocol
    // - SecurityCertificate
    // - Network
    socket.addEventListener('open', () => closeAndResolve(true));
    socket.addEventListener('error', () => closeAndResolve(false));
  });
}
