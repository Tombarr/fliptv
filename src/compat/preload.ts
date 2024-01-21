export function preloadImage(source: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(true));
    img.addEventListener('error', () => reject(false));
    img.src = source;
  });
}
