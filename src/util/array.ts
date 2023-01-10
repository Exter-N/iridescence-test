export function arrayDelete<T>(array: T[], element: T): boolean {
    const i = array.indexOf(element);
    if (i < 0) {
        return false;
    }

    array.splice(i, 1);

    return true;
}

export function arrayDeleteFound<T>(array: T[], predicate: (value: T, index: number, array: T[]) => boolean): { deleted: false; } | { deleted: true; element: T; } {
    const i = array.findIndex(predicate);
    if (i < 0) {
        return { deleted: false };
    }

    const element = array[i];
    array.splice(i, 1);

    return { deleted: true, element };
}

export function arrayBinarySearch<T>(array: T[], value: T, compare?: (x: T, y: T) => number, start: number = 0, end: number = array.length): number {
    --end;
    if (compare) {
        while (end >= start) {
            const middle: number = start + ((end - start) >> 1);
            const cmp = compare(value, array[middle]);
            if (cmp === 0) {
                return middle;
            } else if (cmp < 0) {
                end = middle - 1;
            } else {
                start = middle + 1;
            }
        }
    } else {
        while (end >= start) {
            const middle: number = start + ((end - start) >> 1);
            const element = array[middle];
            if (value === element) {
                return middle;
            } else if (value < element) {
                end = middle - 1;
            } else {
                start = middle + 1;
            }
        }
    }

    return ~start;
}

export function arrayBinarySearchKey<T, K>(array: T[], key: K, keyFromElement: (element: T) => K, compare?: (x: K, y: K) => number, start: number = 0, end: number = array.length): number {
    --end;
    if (compare) {
        while (end >= start) {
            const middle: number = start + ((end - start) >> 1);
            const cmp = compare(key, keyFromElement(array[middle]));
            if (cmp === 0) {
                return middle;
            } else if (cmp < 0) {
                end = middle - 1;
            } else {
                start = middle + 1;
            }
        }
    } else {
        while (end >= start) {
            const middle: number = start + ((end - start) >> 1);
            const element = keyFromElement(array[middle]);
            if (key === element) {
                return middle;
            } else if (key < element) {
                end = middle - 1;
            } else {
                start = middle + 1;
            }
        }
    }

    return ~start;
}

export function randomElement<T>(array: T[]): T | undefined {
    switch (array.length) {
        case 0:
            return undefined;
        case 1:
            return array[0];
        default:
            return array[Math.floor(Math.random() * array.length)];
    }
}