export const leftPad = (toPad: string, desiredLength: number, paddingStr: string): string => {
    const padSize = desiredLength - toPad.length;
    if (padSize <= 0) {
        return toPad;
    }

    const paddingStrCount = Math.floor(padSize / paddingStr.length);
    const padding = new Array(paddingStrCount + 1).join(paddingStr);
    return padding + toPad;
}