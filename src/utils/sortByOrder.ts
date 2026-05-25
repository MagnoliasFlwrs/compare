/** Копия массива, отсортированная по полю order (по возрастанию). */
export function sortByOrder<T extends { order?: number | null }>(items: readonly T[]): T[] {
    return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** order, при равенстве — по name (для сущностей без order в API). */
export function sortByOrderThenName<
    T extends { order?: number | null; name?: string },
>(items: readonly T[]): T[] {
    return [...items].sort((a, b) => {
        const byOrder = (a.order ?? 0) - (b.order ?? 0);
        if (byOrder !== 0) return byOrder;
        return (a.name ?? '').localeCompare(b.name ?? '', 'ru');
    });
}
