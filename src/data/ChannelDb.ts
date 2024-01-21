import '../../types/dom';
import type { Channel } from "../../types/channel";

const indexedDB = (
  window.indexedDB ||
  window.mozIndexedDB || 
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.OIndexedDB
);

const VERSION = 1;
const DATABASE_NAME = 'channels';
const STORE_NAME = 'channels';
const ID = 'videoid';

const store = (db: IDBDatabase, mode: IDBTransactionMode = 'readonly') =>
  db.transaction([STORE_NAME], mode).objectStore(STORE_NAME);

let database: IDBDatabase = null;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (database) {
      return resolve(database);
    }

    const onAbort = () => {
      if (database) {
        database.close();
      }
      database = null;
    };

    const request: IDBOpenDBRequest = indexedDB.open(DATABASE_NAME, VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onabort = onAbort;
      resolve(database = db);
    };

    request.onupgradeneeded = () => {
      try {
        const db = request.result;
        db.onabort = onAbort;

        // Create object store and index
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          return new Promise((innerResolve, innerReject) => {
            const dbStore = db.createObjectStore(STORE_NAME);
            dbStore.createIndex(ID, ID, { unique: true });
            dbStore.transaction.oncomplete = () => innerResolve(database = db);
            dbStore.transaction.onerror = innerReject;
          });
        }

        resolve(database = db);
      } catch (err) {
        reject(err);
      }
    };
  });
}

export function getChannels(): Promise<Channel[]> {
  return new Promise((resolve, reject) => {
    open()
      .then((db) => {
        const kvStore = store(db);
        const request = kvStore.openCursor();
        const result = [];

        request.onerror = () => reject(request.error);
        request.onsuccess = function() {
          const cursor = request.result;
          if (cursor) {
            result.push(cursor.value);
            cursor.continue();
          } else {
            resolve(result);
          }
        };
      })
      .catch(reject);
  });
}

export function setChannels(channels: Channel[]): Promise<string> {
  return new Promise((resolve, reject) => {
    open()
      .then((db) => {
        console.log('setChannels', channels);
        const trans: IDBTransaction = db.transaction([STORE_NAME], 'readwrite');
        const kvStore = trans.objectStore(STORE_NAME);
        channels.filter((channel) => (ID in channel))
          .map((channel) => kvStore.put(channel, channel[ID]));
        trans.oncomplete = (e) => resolve(e.type);
        trans.onerror = () => reject(trans.error);

        // FF74+: https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/commit
        if ('commit' in trans) {
          trans.commit();
        }
      })
      .catch(reject);
  });
}
