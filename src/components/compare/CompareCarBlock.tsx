import React, { useMemo } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Checkbox, Typography } from 'antd';
import type { Attribute } from '../../types/attributes';
import type { CompareTableSide } from '../../utils/compare/loadCompareTableData';
import { formatPowertrainLabel } from '../../utils/compare/loadCompareTableData';
import { getCarPriceCellKey } from '../../stores/carPricesStore';
import { formatAttributeValueDisplay } from '../entityAttributes/formatAttributeValueDisplay';
import { cellBeatsOpponents } from '../../utils/compare/compareAdvantage';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { resolveImageUrl } from '../generations/utils';

function formatPrice(value: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}

export type CompareBlockUiState = {
    keepAdvantages: boolean;
    showBaseCharacteristics: boolean;
    hiddenTrimIds: Set<string>;
};

type OpponentContext = {
    trimIds: string[];
    getOpponentValues: (attributeId: string) => (EntityAttributeValue | undefined)[];
};

interface Props {
    side: 'left' | 'right';
    data: CompareTableSide;
    ui: CompareBlockUiState;
    onUiChange: (patch: Partial<CompareBlockUiState>) => void;
    opponents: OpponentContext;
}

function CharCell({
    attribute,
    value,
    highlight,
}: {
    attribute: Attribute;
    value: EntityAttributeValue | undefined;
    highlight: boolean;
}) {
    const display = formatAttributeValueDisplay(attribute, value);
    const isBoolYes = attribute.type === 'BOOLEAN' && value?.valueBoolean === true;

    return (
        <td className={highlight ? 'compare-cell-advantage' : undefined}>
            {isBoolYes ? (
                <span className="compare-cell-boolean-yes">+</span>
            ) : (
                display
            )}
        </td>
    );
}

const CompareCarBlock: React.FC<Props> = ({
    side,
    data,
    ui,
    onUiChange,
    opponents,
}) => {
    const visibleTrims = useMemo(
        () => data.trims.filter((t) => !ui.hiddenTrimIds.has(t.id)),
        [data.trims, ui.hiddenTrimIds],
    );

    const characteristicRows = useMemo(() => {
        const rows: { attribute: Attribute; isBase: boolean }[] = [];
        if (ui.showBaseCharacteristics) {
            for (const a of data.specAttributes) {
                rows.push({ attribute: a, isBase: true });
            }
        }
        for (const a of data.trimAttributes) {
            rows.push({ attribute: a, isBase: false });
        }
        return rows.sort((x, y) => x.attribute.name.localeCompare(y.attribute.name, 'ru'));
    }, [data.specAttributes, data.trimAttributes, ui.showBaseCharacteristics]);

    const filteredRows = useMemo(() => {
        if (!ui.keepAdvantages) return characteristicRows;

        return characteristicRows.filter(({ attribute, isBase }) => {
            if (attribute.advantageType === 'NONE') return false;

            if (isBase) {
                const myVal = data.specValuesByAttributeId[attribute.id];
                const opps = opponents.getOpponentValues(attribute.id);
                return cellBeatsOpponents(attribute, myVal, opps);
            }

            return visibleTrims.some((trim) => {
                const myVal = data.valuesByTrimId[trim.id]?.[attribute.id];
                const opps = opponents.getOpponentValues(attribute.id);
                return cellBeatsOpponents(attribute, myVal, opps);
            });
        });
    }, [
        characteristicRows,
        ui.keepAdvantages,
        data,
        visibleTrims,
        opponents,
    ]);

    const hideTrim = (trimId: string) => {
        const next = new Set(ui.hiddenTrimIds);
        next.add(trimId);
        onUiChange({ hiddenTrimIds: next });
    };

    const logoUrl = data.brand?.logoUrl ? resolveImageUrl(data.brand.logoUrl) : null;

    const getCellValue = (
        attribute: Attribute,
        isBase: boolean,
        trimId: string,
    ): EntityAttributeValue | undefined => {
        if (isBase) {
            return data.specValuesByAttributeId[attribute.id];
        }
        return data.valuesByTrimId[trimId]?.[attribute.id];
    };

    const labelFirst = side === 'right';

    return (
        <div className={`compare-car-block compare-block--${side}`}>
            <div className="compare-car-header">
                {side === 'left' && logoUrl ? (
                    <img src={logoUrl} alt="" className="compare-brand-logo" />
                ) : null}
                <div>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        {data.modelName}
                    </Typography.Title>
                    {data.generationLabel ? (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {data.generationLabel}
                        </Typography.Text>
                    ) : null}
                </div>
                {side === 'right' && logoUrl ? (
                    <img src={logoUrl} alt="" className="compare-brand-logo" />
                ) : null}
            </div>

            <div className="compare-matrix-wrap">
                {data.powertrains.length === 0 || visibleTrims.length === 0 ? (
                    <Typography.Text type="secondary">
                        Нет данных для матрицы цен
                    </Typography.Text>
                ) : (
                    <table className="compare-matrix">
                        <thead>
                            <tr>
                                <th style={{ minWidth: 140 }} />
                                {visibleTrims.map((trim) => (
                                    <th key={trim.id}>
                                        {trim.name}
                                        <button
                                            type="button"
                                            className="compare-trim-close no-print"
                                            title="Скрыть комплектацию"
                                            onClick={() => hideTrim(trim.id)}
                                        >
                                            <CloseOutlined />
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.powertrains.map((pt) => (
                                <tr key={pt.id}>
                                    <td>{formatPowertrainLabel(pt)}</td>
                                    {visibleTrims.map((trim) => {
                                        const key = getCarPriceCellKey(pt.id, trim.id);
                                        const cell = data.priceByCell[key];
                                        return (
                                            <td key={trim.id}>
                                                {cell ? (
                                                    formatPrice(cell.price)
                                                ) : (
                                                    <span className="compare-price-empty">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="compare-controls no-print">
                <Checkbox
                    checked={ui.keepAdvantages}
                    onChange={(e) => onUiChange({ keepAdvantages: e.target.checked })}
                >
                    Оставить преимущества
                </Checkbox>
                <Checkbox
                    checked={ui.showBaseCharacteristics}
                    onChange={(e) =>
                        onUiChange({ showBaseCharacteristics: e.target.checked })
                    }
                >
                    Отобразить базовые хар-ки
                </Checkbox>
            </div>

            {filteredRows.length === 0 ? (
                <Typography.Text type="secondary">
                    {ui.keepAdvantages
                        ? 'Нет строк с преимуществами'
                        : 'Нет характеристик для отображения'}
                </Typography.Text>
            ) : (
                <table className="compare-char-table">
                    <tbody>
                        {filteredRows.map(({ attribute, isBase }) => {
                            const opponentVals = opponents.getOpponentValues(attribute.id);

                            if (isBase) {
                                const myVal = data.specValuesByAttributeId[attribute.id];
                                const highlight = cellBeatsOpponents(
                                    attribute,
                                    myVal,
                                    opponentVals,
                                );
                                const colSpan = Math.max(visibleTrims.length, 1);
                                const display = formatAttributeValueDisplay(attribute, myVal);
                                const isBoolYes =
                                    attribute.type === 'BOOLEAN' && myVal?.valueBoolean === true;
                                return (
                                    <tr key={`${attribute.id}-base`}>
                                        {labelFirst ? (
                                            <td className="compare-char-label">
                                                {attribute.name}
                                            </td>
                                        ) : null}
                                        <td
                                            colSpan={colSpan}
                                            className={
                                                highlight ? 'compare-cell-advantage' : undefined
                                            }
                                        >
                                            {isBoolYes ? (
                                                <span className="compare-cell-boolean-yes">+</span>
                                            ) : (
                                                display
                                            )}
                                        </td>
                                        {!labelFirst ? (
                                            <td className="compare-char-label">
                                                {attribute.name}
                                            </td>
                                        ) : null}
                                    </tr>
                                );
                            }

                            const rowCells = visibleTrims.map((trim) => {
                                const val = getCellValue(attribute, isBase, trim.id);
                                const highlight = cellBeatsOpponents(
                                    attribute,
                                    val,
                                    opponentVals,
                                );
                                return (
                                    <CharCell
                                        key={trim.id}
                                        attribute={attribute}
                                        value={val}
                                        highlight={highlight}
                                    />
                                );
                            });

                            return (
                                <tr key={attribute.id}>
                                    {labelFirst ? (
                                        <>
                                            <td className="compare-char-label">
                                                {attribute.name}
                                            </td>
                                            {rowCells}
                                        </>
                                    ) : (
                                        <>
                                            {rowCells}
                                            <td className="compare-char-label">
                                                {attribute.name}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CompareCarBlock;
