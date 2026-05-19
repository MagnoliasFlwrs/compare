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

export function resolveReferenceLabel(
    value: unknown,
    nameById: Map<string, string> | undefined,
): string {
    if (!nameById) return '—';
    if (value && typeof value === 'object') {
        const name = (value as { name?: unknown }).name;
        if (typeof name === 'string' && name.trim()) return name.trim();
        const id = pickIdString(value);
        if (id) return nameById.get(id) ?? '—';
    }
    if (typeof value === 'string' && value) {
        return nameById.get(value) ?? value;
    }
    return '—';
}

export function displayNum(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return String(value);
}
