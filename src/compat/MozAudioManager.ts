import type { KaiosHTMLMediaElement, KaiosNavigator } from "../../types/dom";

export const CONTENT = 'content';
export const NORMAL = 'normal';
export const ALARM = 'alarm';
export const NOTIFICATION = 'notification';

export function setAudioChannel(channel: string): boolean {
  const kaiosNavigator = (navigator as KaiosNavigator);

  if (kaiosNavigator.mozAudioChannelManager) {
    kaiosNavigator.mozAudioChannelManager.volumeControlChannel = channel;
    return (kaiosNavigator.mozAudioChannelManager.volumeControlChannel === channel);
  }

  return false;
}

export function setAudioChannelType(element: HTMLMediaElement, channel: string) {
  const kaiosEl = (element as KaiosHTMLMediaElement);
  if (kaiosEl.mozAudioChannelType) {
    kaiosEl.mozAudioChannelType = channel;
  }
}

const channelMap = new Map<string, boolean>();

// @returns [Boolean] True if the device supports a given audio channel
export function supportsAudioChannel(channel: string): boolean {
  // Check for Audio Channel API
  if (!('mozAudioChannelType' in HTMLAudioElement.prototype)) {
    return false;
  }

  if (channelMap.has(channel)) {
    return channelMap.get(channel);
  }

  // Create audio element to test channel support
  const a = (document.createElement('audio') as KaiosHTMLMediaElement);
  a.mozAudioChannelType = channel;
  const supported = (a.mozAudioChannelType === channel);
  channelMap.set(channel, supported);
  return supported;
}

export function isHeadphones(): boolean {
  const kaiosNavigator = (navigator as KaiosNavigator);

  if (kaiosNavigator.mozAudioChannelManager) {
    return Boolean(kaiosNavigator.mozAudioChannelManager.headphones);
  }

  return null;
}

export function setHeadphoneChange(listener: (headphones: boolean) => void): boolean {
  const kaiosNavigator = (navigator as KaiosNavigator);

  if (kaiosNavigator.mozAudioChannelManager) {
    kaiosNavigator.mozAudioChannelManager.onheadphoneschange = () => {
      listener(Boolean(kaiosNavigator.mozAudioChannelManager.headphones));
    };
    return true;
  }

  return false;
}
