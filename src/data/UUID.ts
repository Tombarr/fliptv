export const NAMESPACE = 'uuid';

// Source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/ug, (c) =>
    (Number(c) ^ (crypto || window['msCrypto']).getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
  );
}

export function setUuid(uuid) {
  localStorage.setItem(NAMESPACE, uuid);
  return uuid;
}

export function getSavedUuid() {
  return localStorage.getItem(NAMESPACE);
}

export function getUuid() {
  return localStorage.getItem(NAMESPACE) || setUuid(uuidv4());
}
