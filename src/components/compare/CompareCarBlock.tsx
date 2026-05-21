/**
 * Одна половина таблицы сравнения (50% ширины): шапка с ценами по агрегатам,
 * строка комплектаций с чекбоксами, тело — характеристики.
 * Слева фиксированная колонка первая, справа — последняя.
 */
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Select, Typography } from 'antd';
import type { Attribute } from '../../types/attributes';
import type { CompareBlockUiState } from '../../types/compare';
import type { CompareTableSide } from '../../utils/compare/loadCompareTableData';
import { formatPowertrainLabel } from '../../utils/compare/loadCompareTableData';
import type { AlignedCharRow, CharRowDef } from '../../utils/compare/compareDisplayRows';
import { resolveActiveSpecification } from '../../utils/compare/compareDisplayRows';
import { getCarPriceCellKey } from '../../stores/carPricesStore';
import { formatAttributeValueDisplay } from '../entityAttributes/formatAttributeValueDisplay';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { resolveImageUrl } from '../generations/utils';
import {
    formatSpecBuiltInDisplay,
    type SpecBuiltInFieldKey,
    type SpecFieldRefs,
} from '../../utils/compare/specificationCompareFields';

export type { CompareBlockUiState };

function formatPrice(value: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}

interface Props {
    side: 'left' | 'right';
    data: CompareTableSide;
    ui: CompareBlockUiState;
    onUiChange: (patch: Partial<CompareBlockUiState>) => void;
    alignedCharRows: AlignedCharRow[];
    displayRowsByKey: Map<string, CharRowDef>;
    hoveredRowKey: string | null;
    onHoverRowKey: (key: string | null) => void;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
    specFieldRefs: SpecFieldRefs;
}

/** Ячейка значения атрибута комплектации (или базового — одно значение на все столбцы). */
function TrimValueCell({
    attribute,
    value,
}: {
    attribute: Attribute;
    value: EntityAttributeValue | undefined;
}) {
    const display = formatAttributeValueDisplay(attribute, value);
    const isBoolYes = attribute.type === 'BOOLEAN' && value?.valueBoolean === true;

    return (
        <td className="compare-col-trim">
            {isBoolYes ? <span className="compare-cell-boolean-yes">+</span> : display}
        </td>
    );
}

const CompareCarBlock: React.FC<Props> = ({
    side,
    data,
    ui,
    onUiChange,
    alignedCharRows,
    displayRowsByKey,
    hoveredRowKey,
    onHoverRowKey,
    scrollRef,
    onScroll,
    specFieldRefs,
}) => {
    const isLeft = side === 'left';
    const headerRef = useRef<HTMLTableSectionElement>(null);
    const [stickyTops, setStickyTops] = React.useState<number[]>([]);

    const visibleTrims = useMemo(
        () => data.trims.filter((t) => !ui.hiddenTrimIds.has(t.id)),
        [data.trims, ui.hiddenTrimIds],
    );
    const trimColCount = Math.max(visibleTrims.length, 1);
    // Строки thead: по одной на силовой агрегат (цены) + строка заголовков комплектаций
    const powertrainRows = data.powertrains.length > 0 ? data.powertrains : null;
    const headerRowCount = (powertrainRows?.length ?? 1) + 1;

    // Смещения для position:sticky в шапке при вертикальном скролле
    useLayoutEffect(() => {
        const thead = headerRef.current;
        if (!thead) return;
        const rows = thead.querySelectorAll('tr');
        let offset = 0;
        const tops: number[] = [];
        rows.forEach((row) => {
            tops.push(offset);
            offset += row.getBoundingClientRect().height;
        });
        setStickyTops(tops);
    }, [headerRowCount, visibleTrims.length, data.powertrains.length]);

    const hideTrim = (trimId: string) => {
        const next = new Set(ui.hiddenTrimIds);
        next.add(trimId);
        onUiChange({ hiddenTrimIds: next });
    };

    const showAllTrims = () => onUiChange({ hiddenTrimIds: new Set() });

    const logoUrl = data.brand?.logoUrl ? resolveImageUrl(data.brand.logoUrl) : null;

    const stickyStyle = (rowIndex: number): React.CSSProperties | undefined => {
        const top = stickyTops[rowIndex];
        if (top == null) return undefined;
        return {
            position: 'sticky',
            top,
            zIndex: 10 + rowIndex,
        };
    };

    const activeSpec = resolveActiveSpecification(data, ui);

    // Фиксированная ячейка: чекбоксы, выбор варианта кузова (если несколько specifications)
    const controlsCell = (rowIndex: number) => (
        <td
            className="compare-col-fixed compare-col-fixed--controls"
            style={stickyStyle(rowIndex)}
        >
            <div className="compare-controls-inline no-print">
                {data.specifications.length > 1 ? (
                    <Select
                        size="small"
                        className="compare-spec-select"
                        value={activeSpec?.id}
                        options={data.specifications.map((s) => ({
                            value: s.id,
                            label: s.name,
                        }))}
                        onChange={(id) => onUiChange({ selectedSpecificationId: id })}
                        disabled={!ui.showBaseCharacteristics}
                    />
                ) : null}
                <Checkbox
                    checked={ui.keepAdvantages}
                    onChange={(e) => onUiChange({ keepAdvantages: e.target.checked })}
                >
                    оставить преимущества
                </Checkbox>
                <Checkbox
                    checked={ui.showBaseCharacteristics}
                    onChange={(e) =>
                        onUiChange({ showBaseCharacteristics: e.target.checked })
                    }
                >
                    отобразить базовые хар-ки
                </Checkbox>
                {ui.hiddenTrimIds.size > 0 ? (
                    <Button
                        type="link"
                        size="small"
                        className="compare-show-all-trims"
                        onClick={showAllTrims}
                    >
                        показать все комплектации
                    </Button>
                ) : null}
            </div>
        </td>
    );

    const renderTrimCellsSimple = (
        factory: (trim: (typeof visibleTrims)[0]) => React.ReactNode,
        rowIndex: number,
        extraClass = '',
    ) => {
        const style = stickyStyle(rowIndex);
        if (visibleTrims.length === 0) {
            return (
                <td className={`compare-col-trim ${extraClass}`} style={style}>
                    —
                </td>
            );
        }
        return visibleTrims.map((trim) => {
            const node = factory(trim);
            if (React.isValidElement(node)) {
                return React.cloneElement(
                    node as React.ReactElement<{ className?: string; style?: React.CSSProperties }>,
                    {
                        className: [
                            (node as React.ReactElement).props?.className,
                            extraClass,
                        ]
                            .filter(Boolean)
                            .join(' '),
                        style: { ...(node as React.ReactElement).props?.style, ...style },
                    },
                );
            }
            return node;
        });
    };

    // Порядок колонок: слева [фикс | комплектации], справа [комплектации | фикс]
    const orderCells = (fixed: React.ReactNode, trimCells: React.ReactNode) =>
        isLeft ? (
            <>
                {fixed}
                {trimCells}
            </>
        ) : (
            <>
                {trimCells}
                {fixed}
            </>
        );

    const getTrimAttributeValue = (
        attribute: Attribute,
        trimId: string,
    ): EntityAttributeValue | undefined =>
        data.valuesByTrimId[trimId]?.[attribute.id];

    const getSpecAttributeValue = (attribute: Attribute): EntityAttributeValue | undefined => {
        if (!activeSpec) return undefined;
        return data.specValuesBySpecId[activeSpec.id]?.[attribute.id];
    };

    // Базовая характеристика из полей specification (длина, бак…) — одинаково во всех столбцах
    const renderSpecFieldCells = (fieldKey: SpecBuiltInFieldKey) => {
        if (!activeSpec) {
            return <td className="compare-col-trim">—</td>;
        }
        const display = formatSpecBuiltInDisplay(activeSpec, fieldKey, specFieldRefs);

        if (visibleTrims.length === 0) {
            return <td className="compare-col-trim">{display}</td>;
        }
        return visibleTrims.map((trim) => (
            <td key={trim.id} className="compare-col-trim">
                {display}
            </td>
        ));
    };

    let headerRowIndex = 0;

    return (
        <div className={`compare-car-block compare-block--${side}`}>
            <div className="compare-car-header">
                {isLeft && logoUrl ? (
                    <img src={logoUrl} alt="" className="compare-brand-logo" />
                ) : null}
                <div className="compare-car-header-text">
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        {data.modelName}
                    </Typography.Title>
                    {data.generationLabel ? (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {data.generationLabel}
                        </Typography.Text>
                    ) : null}
                </div>
                {!isLeft && logoUrl ? (
                    <img src={logoUrl} alt="" className="compare-brand-logo" />
                ) : null}
            </div>

            <div
                className="compare-table-scroll"
                ref={scrollRef}
                onScroll={onScroll}
            >
                <table className="compare-side-table">
                    <colgroup>
                        {isLeft ? <col className="compare-col-fixed" /> : null}
                        {Array.from({ length: trimColCount }).map((_, i) => (
                            <col key={i} className="compare-col-trim" />
                        ))}
                        {!isLeft ? <col className="compare-col-fixed" /> : null}
                    </colgroup>
                    <thead ref={headerRef} className="compare-sticky-head">
                        {powertrainRows
                            ? powertrainRows.map((pt) => {
                                  const rowIdx = headerRowIndex++;
                                  // Слева/справа: подпись агрегата (мотор, мощность — без name)
                                  const fixed = (
                                      <td
                                          className="compare-col-fixed compare-col-fixed--dark"
                                          style={stickyStyle(rowIdx)}
                                      >
                                          {formatPowertrainLabel(pt)}
                                      </td>
                                  );
                                  const trimCells = renderTrimCellsSimple(
                                      (trim) => {
                                          const key = getCarPriceCellKey(pt.id, trim.id);
                                          const cell = data.priceByCell[key];
                                          return (
                                              <td className="compare-col-trim compare-col-trim--dark">
                                                  {cell ? (
                                                      formatPrice(cell.price)
                                                  ) : (
                                                      <span className="compare-price-empty">
                                                          —
                                                      </span>
                                                  )}
                                              </td>
                                          );
                                      },
                                      rowIdx,
                                      'compare-col-trim--dark',
                                  );
                                  return (
                                      <tr key={pt.id} className="row-price">
                                          {orderCells(fixed, trimCells)}
                                      </tr>
                                  );
                              })
                            : (() => {
                                  const rowIdx = headerRowIndex++;
                                  return (
                                      <tr className="row-price">
                                          {orderCells(
                                              <td
                                                  className="compare-col-fixed compare-col-fixed--dark"
                                                  style={stickyStyle(rowIdx)}
                                              >
                                                  —
                                              </td>,
                                              renderTrimCellsSimple(
                                                  () => (
                                                      <td className="compare-col-trim compare-col-trim--dark">
                                                          —
                                                      </td>
                                                  ),
                                                  rowIdx,
                                                  'compare-col-trim--dark',
                                              ),
                                          )}
                                      </tr>
                                  );
                              })()}
                        {/* Названия комплектаций и кнопка скрытия столбца */}
                        <tr className="row-trim-header">
                            {orderCells(
                                controlsCell(headerRowIndex),
                                renderTrimCellsSimple(
                                    (trim) => (
                                        <td className="compare-col-trim compare-col-trim--header">
                                            {trim.name}
                                            <button
                                                type="button"
                                                className="compare-trim-close no-print"
                                                title="Скрыть комплектацию"
                                                onClick={() => hideTrim(trim.id)}
                                            >
                                                <CloseOutlined />
                                            </button>
                                        </td>
                                    ),
                                    headerRowIndex,
                                    'compare-col-trim--header',
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Строки характеристик: общий порядок с другой половиной (alignedCharRows) */}
                        {alignedCharRows.length === 0 ? (
                            <tr className="row-char">
                                {orderCells(
                                    <td className="compare-col-fixed">
                                        {ui.keepAdvantages
                                            ? 'Нет строк с преимуществами'
                                            : 'Нет характеристик'}
                                    </td>,
                                    visibleTrims.length === 0 ? (
                                        <td className="compare-col-trim compare-col-trim--empty">
                                            —
                                        </td>
                                    ) : (
                                        visibleTrims.map((trim) => (
                                            <td
                                                key={trim.id}
                                                className="compare-col-trim compare-col-trim--empty"
                                            >
                                                —
                                            </td>
                                        ))
                                    ),
                                )}
                            </tr>
                        ) : (
                            alignedCharRows.map((aligned, rowIndex) => {
                                const rowDef = displayRowsByKey.get(aligned.key);
                                const isHovered = hoveredRowKey === aligned.key;
                                const isEven = rowIndex % 2 === 1;
                                const rowClass = [
                                    'row-char',
                                    isEven ? 'row-char--even' : 'row-char--odd',
                                    isHovered ? 'row-char--hover' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ');

                                const labelCell = (
                                    <td className="compare-col-fixed compare-col-fixed--label">
                                        {aligned.name}
                                    </td>
                                );

                                if (!rowDef) {
                                    return (
                                        <tr
                                            key={aligned.key}
                                            className={rowClass}
                                            onMouseEnter={() => onHoverRowKey(aligned.key)}
                                            onMouseLeave={() => onHoverRowKey(null)}
                                        >
                                            {orderCells(
                                                labelCell,
                                                visibleTrims.length === 0 ? (
                                                    <td className="compare-col-trim">—</td>
                                                ) : (
                                                    visibleTrims.map((trim) => (
                                                        <td
                                                            key={trim.id}
                                                            className="compare-col-trim"
                                                        >
                                                            —
                                                        </td>
                                                    ))
                                                ),
                                            )}
                                        </tr>
                                    );
                                }

                                if (rowDef.kind === 'spec-field') {
                                    return (
                                        <tr
                                            key={aligned.key}
                                            className={rowClass}
                                            onMouseEnter={() => onHoverRowKey(aligned.key)}
                                            onMouseLeave={() => onHoverRowKey(null)}
                                        >
                                            {orderCells(labelCell, renderSpecFieldCells(rowDef.fieldKey))}
                                        </tr>
                                    );
                                }

                                const { attribute } = rowDef;
                                const isBase = rowDef.kind === 'spec-attribute';

                                const trimCells =
                                    visibleTrims.length === 0 ? (
                                        <td className="compare-col-trim">—</td>
                                    ) : (
                                        visibleTrims.map((trim) => {
                                            const val = isBase
                                                ? getSpecAttributeValue(attribute)
                                                : getTrimAttributeValue(attribute, trim.id);
                                            return (
                                                <TrimValueCell
                                                    key={trim.id}
                                                    attribute={attribute}
                                                    value={val}
                                                />
                                            );
                                        })
                                    );

                                return (
                                    <tr
                                        key={aligned.key}
                                        className={rowClass}
                                        onMouseEnter={() => onHoverRowKey(aligned.key)}
                                        onMouseLeave={() => onHoverRowKey(null)}
                                    >
                                        {orderCells(labelCell, trimCells)}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompareCarBlock;
