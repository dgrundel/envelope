const DECIMAL_SEPARATOR = '.';

export const leftPad = (toPad: string, desiredLength: number, paddingStr: string): string => {
    const padSize = desiredLength - toPad.length;
    if (padSize <= 0) {
        return toPad;
    }

    const paddingStrCount = Math.floor(padSize / paddingStr.length);
    const padding = new Array(paddingStrCount + 1).join(paddingStr);
    return padding + toPad;
}

export const currencyFormatter = (whole: number, fractional: number) => {
    const cents = Math.ceil(fractional / 10).toFixed(0);
    const formattedCents = leftPad(cents, 2, '0');
    const formattedWhole = Math.abs(whole);
    const sign = whole < 0 ? '-' : '';

    return `${sign}$${formattedWhole}${DECIMAL_SEPARATOR}${formattedCents}`;
};