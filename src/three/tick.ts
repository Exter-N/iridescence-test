import stats from "./stats";
import PartiallyOrderedMap from "../util/pomap";
import MulticastCallback from "../util/multicast-callback";

export type TickFunction = (time: number, deltaTime: number) => void;

const tickFunctions = new PartiallyOrderedMap<string, TickFunction>();

interface TickFunctionOptions {
    before?: string[];
    after?: string[];
}

export function registerTickFunction(key: string, fn: TickFunction, options?: TickFunctionOptions): void {
    tickFunctions.set(key, fn);
    if (options?.before) {
        tickFunctions.addBefore(key, options.before);
    }
    if (options?.after) {
        tickFunctions.addAfter(key, options.after);
    }
}

export function registerMulticastTickFunction(key: string, options?: TickFunctionOptions): MulticastCallback<Parameters<TickFunction>> {
    const multi = new MulticastCallback<Parameters<TickFunction>>();
    registerTickFunction(key, multi.call.bind(multi), options);

    return multi;
}

let lastFrameTime = performance.now();
let updateStatsIn = 30;

function animate(time: number) {
    requestAnimationFrame(animate);

    if (updateStatsIn <= 0) {
        stats.begin();
    }

    const prev = lastFrameTime;
    lastFrameTime = time;
    const deltaTime = (time - prev) / 1000;

    for (const [, fn] of tickFunctions) {
        fn(time, deltaTime);
    }

    if (updateStatsIn <= 0) {
        stats.end();
    } else {
        --updateStatsIn;
    }
}

requestAnimationFrame(animate);