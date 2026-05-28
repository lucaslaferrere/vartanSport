const TTL = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export const cache = {
    get<T>(key: string): T | null {
        const entry = store.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;
        if (Date.now() - entry.timestamp > TTL) {
            store.delete(key);
            return null;
        }
        return entry.data;
    },

    set<T>(key: string, data: T): void {
        store.set(key, { data, timestamp: Date.now() });
    },

    invalidate(key: string): void {
        store.delete(key);
    },
};
