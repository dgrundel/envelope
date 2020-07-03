
export const combineFlags = (...flags: number[]): number => flags.reduce((combined: number, flag: number) => combined | flag, 0);
export const containsFlag = (needle: number, haystack?: number): boolean => (typeof haystack === 'number') && ((haystack & needle) === needle);