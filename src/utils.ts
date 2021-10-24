export function flatten<T>(array: T[][]): T[] {
    const result: T[] = [];
    array.forEach(a => result.push(...a));
    return result;
}
