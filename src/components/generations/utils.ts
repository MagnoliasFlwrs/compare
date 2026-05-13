export function resolveImageUrl(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        for (const key of ['url', 'original', 'src', 'href', 'large', 'medium', 'small']) {
            const candidate = v[key];
            if (typeof candidate === 'string' && candidate) return candidate;
        }
    }
    return undefined;
}
