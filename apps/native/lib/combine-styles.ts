type CombinedStyles<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
};

export function combineStyles<T extends Record<string, any>>(
  styles: T,
): CombinedStyles<T> {
  return styles as CombinedStyles<T>;
}
