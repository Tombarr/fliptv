const ArrowMap: Map<OrientationLockType, Map<string, string>> = new Map([
  ['portrait-primary', new Map([
    ['ArrowUp', 'ArrowUp'],
    ['ArrowRight', 'ArrowRight'],
    ['ArrowDown', 'ArrowDown'],
    ['ArrowLeft', 'ArrowLeft'],
  ])],
  ['portrait-secondary', new Map([
    ['ArrowUp', 'ArrowDown'],
    ['ArrowRight', 'ArrowLeft'],
    ['ArrowDown', 'ArrowUp'],
    ['ArrowLeft', 'ArrowRight'],
  ])],
  ['landscape-primary', new Map([
    ['ArrowUp', 'ArrowLeft'],
    ['ArrowRight', 'ArrowUp'],
    ['ArrowDown', 'ArrowRight'],
    ['ArrowLeft', 'ArrowDown'],
  ])],
  ['landscape-secondary', new Map([
    ['ArrowUp', 'ArrowRight'],
    ['ArrowRight', 'ArrowDown'],
    ['ArrowDown', 'ArrowLeft'],
    ['ArrowLeft', 'ArrowUp'],
  ])],
]);

export function getArrowKey(orientation: OrientationLockType, code: string) {
  return ArrowMap.get(orientation).get(code);
}
