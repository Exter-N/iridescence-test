import { arrayDelete } from "./array";

export interface PartialOrderDescriptorLike<K, V> {
    readonly hasValue: boolean;
    readonly value?: V;
    readonly after: readonly K[];
}

export interface PartialOrderDescriptorMapLike<K, V> {
    get(key: K): PartialOrderDescriptorLike<K, V> | undefined;
    keys(): Iterable<K>;
}

export class PartialOrderDescriptor<K, V> implements PartialOrderDescriptorLike<K, V> {
    value?: V;
    after: K[];
    before: K[];

    constructor() {
        this.after = [ ];
        this.before = [ ];
    }

    get hasValue(): boolean {
        return 'value' in this;
    }
    get isEmpty(): boolean {
        return !this.hasValue && this.before.length === 0 && this.after.length === 0;
    }
}

function subtract<T>(minuend: T[], subtrahend: T[]): T[] {
    return minuend.filter(item => !subtrahend.includes(item));
}

function updateLinks<K, V>(which: 'before' | 'after', descriptors: Map<K, PartialOrderDescriptor<K, V>>, key: K, oldInverse: K[], newInverse: K[]): void {
    const removed = subtract(oldInverse, newInverse);
    const added = subtract(newInverse, oldInverse);
    for (const k of removed) {
        const descriptor = descriptors.get(k);
        if (null == descriptor || !arrayDelete(descriptor[which], key)) {
            continue;
        }
        if (descriptor.isEmpty) {
            descriptors.delete(k);
        }
    }
    for (const k of added) {
        let descriptor = descriptors.get(k);
        if (null == descriptor) {
            descriptor = new PartialOrderDescriptor<K, V>();
            descriptors.set(k, descriptor);
        }
        descriptor[which].push(key);
    }
}

class OrderedEntriesCollector<K, V> {
    readonly descriptors: PartialOrderDescriptorMapLike<K, V>;
    readonly orderedEntries: [K, V][];
    readonly visitedKeys: Set<K>;
    readonly keyStack: K[];

    constructor(descriptors: PartialOrderDescriptorMapLike<K, V>) {
        this.descriptors = descriptors;
        this.orderedEntries = [ ];
        this.visitedKeys = new Set<K>();
        this.keyStack = [ ];
    }

    collect(key: K, required: boolean): void {
        const i = this.keyStack.indexOf(key);
        if (i >= 0) {
            throw new Error("Cycle with keys " + this.keyStack.slice(i).map(k => String(k)).join(", "));
        }
        this.keyStack.push(key);
        try {
            if (this.visitedKeys.has(key)) {
                return;
            }
            this.visitedKeys.add(key);

            const descriptor = this.descriptors.get(key);
            if (null == descriptor) {
                return;
            }

            const hasValue = descriptor.hasValue;
            if (required && !hasValue) {
                throw new Error('Missing value for key ' + String(key));
            }
            for (const after of descriptor.after) {
                this.collect(after, required || hasValue);
            }
            if (hasValue) {
                this.orderedEntries.push([ key, descriptor.value! ]);
            }
        } finally {
            this.keyStack.pop();
        }
    }

    collectAll(): void {
        for (const key of this.descriptors.keys()) {
            this.collect(key, false);
        }
    }
}

export function constructOrderedEntries<K, V>(descriptors: PartialOrderDescriptorMapLike<K, V>): [K, V][] {
    const collector = new OrderedEntriesCollector(descriptors);
    collector.collectAll();

    return collector.orderedEntries;
}

export default class PartiallyOrderedMap<K, V> implements Map<K, V> {
    private descriptors: Map<K, PartialOrderDescriptor<K, V>>;
    private orderedEntries: [K, V][] | undefined;

    // @ts-expect-error TS2564 compatibility with Map + the property is defined on the prototype
    [Symbol.toStringTag]: string;

    constructor() {
        this.descriptors = new Map<K, PartialOrderDescriptor<K, V>>();
        this.orderedEntries = [];
    }

    get size(): number {
        return this.descriptors.size;
    }

    clear(): void {
        this.descriptors.clear();
        this.orderedEntries = [];
    }
    delete(key: K): boolean {
        const descriptor = this.descriptors.get(key);
        if (null == descriptor) {
            return false;
        }

        const result = delete descriptor.value;
        if (descriptor.isEmpty) {
            this.descriptors.delete(key);
        }
        if (result) {
            this.orderedEntries = undefined;
        }

        return result;
    }
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        this.constructOrderedEntries();
        this.orderedEntries!.forEach(([key, value]) => {
            callbackfn.call(thisArg, value, key, this);
        });
    }
    get(key: K): V | undefined {
        return this.descriptors.get(key)?.value;
    }
    getDescriptor(key: K): PartialOrderDescriptor<K, V> | undefined {
        return this.descriptors.get(key);
    }
    getBefore(key: K): K[] {
        return this.descriptors.get(key)?.before ?? [ ];
    }
    getAfter(key: K): K[] {
        return this.descriptors.get(key)?.after ?? [ ];
    }
    has(key: K): boolean {
        const descriptor = this.descriptors.get(key);

        return null != descriptor && 'value' in descriptor;
    }
    set(key: K, value: V): this {
        const descriptor = this.getOrCreateDescriptor(key);
        if (!('value' in descriptor) || descriptor.value !== value) {
            descriptor.value = value;
            this.orderedEntries = undefined;
        }

        return this;
    }
    setDescriptor(key: K, descriptor: PartialOrderDescriptor<K, V> | undefined): this {
        const previousDescriptor = this.descriptors.get(key);
        if (previousDescriptor !== descriptor) {
            if (null == descriptor || descriptor.isEmpty) {
                this.descriptors.delete(key);
            } else {
                this.descriptors.set(key, descriptor);
            }
            updateLinks('after', this.descriptors, key, previousDescriptor?.before ?? [ ], descriptor?.before ?? [ ]);
            updateLinks('before', this.descriptors, key, previousDescriptor?.after ?? [ ], descriptor?.after ?? [ ]);
            this.orderedEntries = undefined;
        }

        return this;
    }
    setBefore(key: K, before: K[]): this {
        const descriptor = this.getOrCreateDescriptor(key);
        const previousBefore = descriptor.before;
        if (previousBefore !== before) {
            descriptor.before = before;
            updateLinks('after', this.descriptors, key, previousBefore, before);
            this.orderedEntries = undefined;
        }

        return this;
    }
    addBefore(key: K, before: K[]): this {
        if (0 === before.length) {
            return this;
        }
        const descriptor = this.getOrCreateDescriptor(key);
        const previousBefore = descriptor.before;
        before = subtract(before, previousBefore);
        if (0 !== before.length) {
            descriptor.before = previousBefore.concat(before);
            updateLinks('after', this.descriptors, key, [ ], before);
            this.orderedEntries = undefined;
        }

        return this;
    }
    setAfter(key: K, after: K[]): this {
        const descriptor = this.getOrCreateDescriptor(key);
        const previousAfter = descriptor.after;
        if (previousAfter !== after) {
            descriptor.after = after;
            updateLinks('before', this.descriptors, key, previousAfter, after);
            this.orderedEntries = undefined;
        }

        return this;
    }
    addAfter(key: K, after: K[]): this {
        if (0 === after.length) {
            return this;
        }
        const descriptor = this.getOrCreateDescriptor(key);
        const previousAfter = descriptor.after;
        after = subtract(after, previousAfter);
        if (0 !== after.length) {
            descriptor.after = previousAfter.concat(after);
            updateLinks('before', this.descriptors, key, [ ], after);
            this.orderedEntries = undefined;
        }

        return this;
    }
    [Symbol.iterator](): IterableIterator<[K, V]> {
        this.constructOrderedEntries();

        return this.orderedEntries![Symbol.iterator]();
    }
    entries(): IterableIterator<[K, V]> {
        this.constructOrderedEntries();

        return this.orderedEntries![Symbol.iterator]();
    }
    keys(): IterableIterator<K> {
        this.constructOrderedEntries();

        return this.orderedEntries!.map(entry => entry[0])[Symbol.iterator]();
    }
    values(): IterableIterator<V> {
        this.constructOrderedEntries();

        return this.orderedEntries!.map(entry => entry[1])[Symbol.iterator]();
    }
    private getOrCreateDescriptor(key: K): PartialOrderDescriptor<K, V> {
        let descriptor = this.descriptors.get(key);
        if (null == descriptor) {
            descriptor = new PartialOrderDescriptor<K, V>();
            this.descriptors.set(key, descriptor);
            this.orderedEntries = undefined;
        }

        return descriptor;
    }
    private constructOrderedEntries(): void {
        if (null != this.orderedEntries) {
            return;
        }

        this.orderedEntries = constructOrderedEntries(this.descriptors);
    }
}

PartiallyOrderedMap.prototype[Symbol.toStringTag] = "PartiallyOrderedMap";