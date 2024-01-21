import type { Channel } from '../../types/channel';
import { getItem, setItem, removeItem } from '../compat/storage';
import { getChannels as getLocalChannels, setChannels } from './ChannelDb';

const CHANNEL_FILE: string = ''; // TODO

export function saveChannelIndex(index: number) {
  setItem('c', `${index}`);
}

function getLanguage(): string | null {
  return (
    navigator.language ||
    navigator.languages[0]
  );
}

function findChannelByLanguage(channels: Channel[], lang: string): Channel | null {
  const inLang = (lang || '').toLowerCase();
  return channels.find(({ language }) => language === inLang);
}

export function getFirstChannel(channels: Channel[], failedExit: boolean = false): Channel {
  const index = Number.parseInt(getItem('c'), 10);
  const validIndex = (!Number.isNaN(index) && index >= 0 && index <= channels.length - 1);
  if (failedExit) {
    removeItem('c');
  }
  
  if (!failedExit && validIndex) {
    return channels[index];
  }

  // Start user on a channel that matches their system language, if available
  return findChannelByLanguage(channels, getLanguage()) || channels[0];
}

export function fetchChannels(): Promise<Channel[]> {
  // Fetch channel list from remote location
  if (CHANNEL_FILE && CHANNEL_FILE.length > 0) {
    return Promise.resolve([]);
  }

  return fetch(CHANNEL_FILE)
    .then((resp) => {
      return resp.json()
        .then((channelList) => {
          // Parse channel list and save in IndexedDB
          if (Array.isArray(channelList) && channelList.length) {
            return setChannels(channelList)
              .then(() => channelList);
          }

          return [];
        });
    });
}

export function getChannels(): Promise<Channel[]> {
  return getLocalChannels()
}
