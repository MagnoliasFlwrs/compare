import type { DriveType } from '../../stores/driveTypesStore';

/** Варианты привода в форме (подписи) и шаблоны для сопоставления со справочником API. */
export const DRIVE_TYPE_SPECS = [
    { label: 'Передний', patterns: ['передн', 'front', 'fwd'] },
    { label: 'Задний', patterns: ['задн', 'rear', 'rwd'] },
    { label: 'Подключаемый полный', patterns: ['подключа', 'part-time', 'part time'] },
    { label: 'Постоянный полный', patterns: ['постоян', 'full-time', 'full time', 'awd'] },
] as const;

function matchesDriveName(name: string, patterns: readonly string[]): boolean {
    const n = name.trim().toLowerCase();
    return patterns.some((p) => n.includes(p));
}

/** Селект привода: фиксированные подписи, value — id из справочника drive-types. */
export function buildDriveTypeSelectOptions(
    driveTypes: DriveType[],
): { value: string; label: string }[] {
    const used = new Set<string>();
    const options: { value: string; label: string }[] = [];

    for (const spec of DRIVE_TYPE_SPECS) {
        const found =
            driveTypes.find((d) => matchesDriveName(d.name, spec.patterns)) ??
            driveTypes.find(
                (d) => d.name.trim().toLowerCase() === spec.label.toLowerCase(),
            );
        if (found && !used.has(found.id)) {
            used.add(found.id);
            options.push({ value: found.id, label: spec.label });
        }
    }

    for (const d of driveTypes) {
        if (!used.has(d.id)) {
            options.push({ value: d.id, label: d.name });
        }
    }

    return options;
}
