import { arrayDelete } from './array';

export default class MulticastCallback<T extends any[]> {
    private callbacks: ((...args: T) => void)[];
    constructor() {
        this.callbacks = [];
    }
    call(...args: T): void {
        for (const callback of this.callbacks) {
            callback(...args);
        }
    }
    add(callback: (...args: T) => void): void {
        this.callbacks.push(callback);
    }
    delete(callback: (...args: T) => void): boolean {
        return arrayDelete(this.callbacks, callback);
    }
}