import "../../types/dom";

const intArray = new Uint32Array(1);

export function random(): number {
  const cryptoObj = (window.crypto || window.msCrypto);
  if (cryptoObj) {
    return cryptoObj.getRandomValues(intArray)[0] / 2**32;
  }

  return Math.random();
}

export function randomInteger(): number {
  const cryptoObj = (window.crypto || window.msCrypto);
  if (cryptoObj) {
    return cryptoObj.getRandomValues(intArray)[0];
  }

  return Math.random() * 2**32;
}

export function mulberry32(seed: number): () => number {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
