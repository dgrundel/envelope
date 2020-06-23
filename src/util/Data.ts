export const listToMap = <T>(items: T[], keyField: string = '_id'): Record<string, T> => items.reduce((map: Record<string, T>, item: T) => {
    const key = (item as any)[keyField];
    map[key] = item;
    return map;
}, {});