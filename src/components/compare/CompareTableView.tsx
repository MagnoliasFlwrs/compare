/**
 * Таблица сравнения: две половины (CompareCarBlock), общая загрузка detailed,
 * синхронизация скролла, hover строк, чекбокс базовых хар-ки на обе стороны.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PrinterOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import type { CompareBlockUiState, CompareNavigateState } from '../../types/compare';
import type { CompareTableSide } from '../../utils/compare/loadCompareTableData';
import { loadCompareTableSide } from '../../utils/compare/loadCompareTableData';
import {
    buildAlignedCharRows,
    buildCharacteristicRows,
    filterDisplayRows,
    resolveActiveSpecification,
} from '../../utils/compare/compareDisplayRows';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import type { SpecBuiltInFieldKey } from '../../utils/compare/specificationCompareFields';
import { specBuiltInComparableValue } from '../../utils/compare/specificationCompareFields';
import { useCountriesStore } from '../../stores/countriesStore';
import { useBodyTypesStore } from '../../stores/bodyTypesStore';
import CompareCarBlock from './CompareCarBlock';
import './compareTable.css';

interface Props {
    state: CompareNavigateState;
}

function defaultUiState(side: CompareTableSide | null): CompareBlockUiState {
    return {
        keepAdvantages: false,
        showBaseCharacteristics: false,
        hiddenTrimIds: new Set(),
        selectedSpecificationId: side?.specifications[0]?.id,
    };
}

const CompareTableView: React.FC<Props> = ({ state }) => {
    const [left, setLeft] = useState<CompareTableSide | null>(null);
    const [right, setRight] = useState<CompareTableSide | null>(null);
    const [loading, setLoading] = useState(true);
    const [leftUi, setLeftUi] = useState<CompareBlockUiState>(() => defaultUiState(null));
    const [rightUi, setRightUi] = useState<CompareBlockUiState>(() => defaultUiState(null));
    const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);

    const countries = useCountriesStore((s) => s.countries);
    const getCountries = useCountriesStore((s) => s.getCountries);
    const bodyTypes = useBodyTypesStore((s) => s.bodyTypes);
    const getBodyTypes = useBodyTypesStore((s) => s.getBodyTypes);

    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const scrollSyncLock = useRef(false);

    useEffect(() => {
        Promise.all([
            countries.length === 0
                ? getCountries({ page: 1, limit: 500 })
                : Promise.resolve(),
            bodyTypes.length === 0
                ? getBodyTypes({ page: 1, limit: 500 })
                : Promise.resolve(),
        ]).catch(() => {});
    }, [countries.length, bodyTypes.length, getCountries, getBodyTypes]);

    const specFieldRefs = useMemo(
        () => ({
            countryNameById: new Map(countries.map((c) => [c.id, c.name])),
            bodyTypeNameById: new Map(bodyTypes.map((b) => [b.id, b.name])),
        }),
        [countries, bodyTypes],
    );

    // Данные для левой и правой таблицы из GET /generations/:id/detailed
    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            loadCompareTableSide(state.left),
            loadCompareTableSide(state.right),
        ])
            .then(([l, r]) => {
                if (cancelled) return;
                setLeft(l);
                setRight(r);
                setLeftUi(defaultUiState(l));
                setRightUi(defaultUiState(r));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [state]);

    const leftVisibleTrimIds = useMemo(
        () => left?.trims.filter((t) => !leftUi.hiddenTrimIds.has(t.id)).map((t) => t.id) ?? [],
        [left, leftUi.hiddenTrimIds],
    );
    const rightVisibleTrimIds = useMemo(
        () =>
            right?.trims.filter((t) => !rightUi.hiddenTrimIds.has(t.id)).map((t) => t.id) ?? [],
        [right, rightUi.hiddenTrimIds],
    );

    // Значения «с другой стороны» для фильтра «оставить преимущества»
    const leftOpponents = useMemo(
        () => ({
            trimIds: rightVisibleTrimIds,
            getOpponentValues: (attributeId: string): (EntityAttributeValue | undefined)[] => {
                if (!right) return [];
                const vals: (EntityAttributeValue | undefined)[] = [];
                for (const trimId of rightVisibleTrimIds) {
                    vals.push(right.valuesByTrimId[trimId]?.[attributeId]);
                }
                const rightSpec = resolveActiveSpecification(right, rightUi);
                if (rightSpec) {
                    vals.push(right.specValuesBySpecId[rightSpec.id]?.[attributeId]);
                }
                return vals;
            },
            getOpponentSpecFieldValues: (
                fieldKey: SpecBuiltInFieldKey,
            ): (EntityAttributeValue | undefined)[] => {
                const rightSpec = right
                    ? resolveActiveSpecification(right, rightUi)
                    : null;
                if (!rightSpec) return [];
                return [specBuiltInComparableValue(rightSpec, fieldKey)];
            },
        }),
        [right, rightVisibleTrimIds, rightUi],
    );

    const rightOpponents = useMemo(
        () => ({
            trimIds: leftVisibleTrimIds,
            getOpponentValues: (attributeId: string): (EntityAttributeValue | undefined)[] => {
                if (!left) return [];
                const vals: (EntityAttributeValue | undefined)[] = [];
                for (const trimId of leftVisibleTrimIds) {
                    vals.push(left.valuesByTrimId[trimId]?.[attributeId]);
                }
                const leftSpec = resolveActiveSpecification(left, leftUi);
                if (leftSpec) {
                    vals.push(left.specValuesBySpecId[leftSpec.id]?.[attributeId]);
                }
                return vals;
            },
            getOpponentSpecFieldValues: (
                fieldKey: SpecBuiltInFieldKey,
            ): (EntityAttributeValue | undefined)[] => {
                const leftSpec = left ? resolveActiveSpecification(left, leftUi) : null;
                if (!leftSpec) return [];
                return [specBuiltInComparableValue(leftSpec, fieldKey)];
            },
        }),
        [left, leftVisibleTrimIds, leftUi],
    );

    const leftDisplayRows = useMemo(() => {
        if (!left) return [];
        const rows = buildCharacteristicRows(left, leftUi);
        return filterDisplayRows(
            rows,
            left,
            leftUi,
            leftVisibleTrimIds,
            leftOpponents.getOpponentValues,
            leftOpponents.getOpponentSpecFieldValues,
        );
    }, [left, leftUi, leftVisibleTrimIds, leftOpponents]);

    const rightDisplayRows = useMemo(() => {
        if (!right) return [];
        const rows = buildCharacteristicRows(right, rightUi);
        return filterDisplayRows(
            rows,
            right,
            rightUi,
            rightVisibleTrimIds,
            rightOpponents.getOpponentValues,
            rightOpponents.getOpponentSpecFieldValues,
        );
    }, [right, rightUi, rightVisibleTrimIds, rightOpponents]);

    const alignedCharRows = useMemo(
        () => buildAlignedCharRows(leftDisplayRows, rightDisplayRows),
        [leftDisplayRows, rightDisplayRows],
    );

    const leftRowsByKey = useMemo(
        () => new Map(leftDisplayRows.map((r) => [r.key, r])),
        [leftDisplayRows],
    );
    const rightRowsByKey = useMemo(
        () => new Map(rightDisplayRows.map((r) => [r.key, r])),
        [rightDisplayRows],
    );

    const syncScroll = useCallback((source: 'left' | 'right', scrollLeft: number) => {
        if (scrollSyncLock.current) return;
        scrollSyncLock.current = true;
        const other = source === 'left' ? rightScrollRef.current : leftScrollRef.current;
        if (other) other.scrollLeft = scrollLeft;
        requestAnimationFrame(() => {
            scrollSyncLock.current = false;
        });
    }, []);

    // Чекбокс «базовые хар-ки» синхронизируется между левой и правой колонкой
    const patchUi = (
        side: 'left' | 'right',
        patch: Partial<CompareBlockUiState>,
    ) => {
        const apply = (prev: CompareBlockUiState) => ({ ...prev, ...patch });
        if (side === 'left') {
            setLeftUi(apply);
        } else {
            setRightUi(apply);
        }
        if ('showBaseCharacteristics' in patch) {
            const synced = patch.showBaseCharacteristics!;
            if (side === 'left') {
                setRightUi((prev) => ({ ...prev, showBaseCharacteristics: synced }));
            } else {
                setLeftUi((prev) => ({ ...prev, showBaseCharacteristics: synced }));
            }
        }
    };

    const patchLeftUi = (patch: Partial<CompareBlockUiState>) => patchUi('left', patch);
    const patchRightUi = (patch: Partial<CompareBlockUiState>) => patchUi('right', patch);

    if (loading) {
        return (
            <Flex justify="center" style={{ padding: 80 }}>
                <Spin size="large" tip="Загрузка сравнения…" />
            </Flex>
        );
    }

    if (!left || !right) {
        return <Typography.Text type="secondary">Нет данных</Typography.Text>;
    }

    /** Одинаковое число строк цен в thead слева и справа (по max силовых агрегатов). */
    const alignedPriceRowCount = Math.max(
        left.powertrains.length,
        right.powertrains.length,
        1,
    );

    return (
        <div className="compare-print-root" id="compare-print-area">
            <div className="compare-toolbar no-print">
                <Typography.Text type="secondary">
                    Скрытые столбцы и фильтры учитываются при печати
                </Typography.Text>
                <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={() => window.print()}
                >
                    Печать
                </Button>
            </div>

            <div className="compare-table-layout">
                <CompareCarBlock
                    side="left"
                    data={left}
                    ui={leftUi}
                    onUiChange={patchLeftUi}
                    alignedPriceRowCount={alignedPriceRowCount}
                    alignedCharRows={alignedCharRows}
                    displayRowsByKey={leftRowsByKey}
                    hoveredRowKey={hoveredRowKey}
                    onHoverRowKey={setHoveredRowKey}
                    scrollRef={leftScrollRef}
                    onScroll={(e) => syncScroll('left', e.currentTarget.scrollLeft)}
                    specFieldRefs={specFieldRefs}
                />
                <CompareCarBlock
                    side="right"
                    data={right}
                    ui={rightUi}
                    onUiChange={patchRightUi}
                    alignedPriceRowCount={alignedPriceRowCount}
                    alignedCharRows={alignedCharRows}
                    displayRowsByKey={rightRowsByKey}
                    hoveredRowKey={hoveredRowKey}
                    onHoverRowKey={setHoveredRowKey}
                    scrollRef={rightScrollRef}
                    onScroll={(e) => syncScroll('right', e.currentTarget.scrollLeft)}
                    specFieldRefs={specFieldRefs}
                />
            </div>
        </div>
    );
};

export default CompareTableView;
