// A page of artwork would otherwise fire dozens of image requests at once and exhaust the server's database pool.
const MAX_PARALLEL = 4;
let active = 0;
const waiting = [];
export async function limitedImageLoad(task) {
    if (active >= MAX_PARALLEL)
        await new Promise((resolve) => waiting.push(resolve));
    active++;
    try {
        return await task();
    }
    finally {
        active--;
        waiting.shift()?.();
    }
}
