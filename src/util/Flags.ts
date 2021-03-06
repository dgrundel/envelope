
export const hasFlag = (needle: number, haystack: number | undefined): boolean => (typeof haystack === 'number') && ((haystack & needle) === needle);

export const doesNotHaveFlag = (needle: number, haystack: number | undefined): boolean => (typeof haystack === 'number') && ((haystack & needle) === 0);

export const hasAnyFlag = () => {};

export const unionFlags = (...flags: number[]): number => {
    if (flags.length < 2) {
        return flags[0] || 0;
    }
    let union = flags[0];
    for (let i = 1; i < flags.length; i++) {
        union |= flags[i];
    }
    return union;
};

export const intersectFlags = (...flags: number[]): number => {
    if (flags.length < 2) {
        return flags[0] || 0;
    }
    let intersect = flags[0];
    for (let i = 1; i < flags.length; i++) {
        intersect &= flags[i];
    }
    return intersect;
};