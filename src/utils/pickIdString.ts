export function pickIdString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        for (const key of ['id', 'value', 'uuid']) {
            const candidate = v[key];
            if (typeof candidate === 'string') return candidate;
        }
    }
    return '';
}
