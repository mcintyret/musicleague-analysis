export function flatten<T>(array: T[][]): T[] {
    const result: T[] = [];
    array.forEach(a => result.push(...a));
    return result;
}

export function maxBy<T>(array: T[], func: (t: T) => number): T {
    if (array.length === 0) {
        throw new Error();
    }
    let max = Number.NEGATIVE_INFINITY;
    let maxIndex = -1;
    array.forEach((t, i) => {
        const val = func(t);
        if (val > max) {
            max = val;
            maxIndex = i;
        }
    });
    return array[maxIndex];
}