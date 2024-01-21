// localStorage handled with try/ catch to avoid storage quota issues

const memoryStorage = new Map();

export function setItem(key: string, value: string): boolean {
  try {
    memoryStorage.set(key, value);
    localStorage.setItem(key, value);
    return (localStorage.getItem(key) === value);
  } catch (e) {
    console.warn(e);
    return false;
  }
}

export function getItem(key: string): string | null {
  if (memoryStorage.has(key)) {
    return memoryStorage.get(key);
  }

  return localStorage.getItem(key);
}

export function removeItem(key: string): boolean {
  try {
    memoryStorage.delete(key);
    localStorage.removeItem(key);
    return (localStorage.getItem(key) === null);
  } catch (e) {
    console.warn(e);
    return false;
  }
}
