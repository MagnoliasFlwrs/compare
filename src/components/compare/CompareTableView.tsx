import React, { useMemo, useState } from 'react';
import { PrinterOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Spin, Typography } from 'antd';
import type { CompareNavigateState } from '../../types/compare';
import type { CompareTableSide } from '../../utils/compare/loadCompareTableData';
import { loadCompareTableSide } from '../../utils/compare/loadCompareTableData';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import CompareCarBlock, { type CompareBlockUiState } from './CompareCarBlock';
import './compareTable.css';

interface Props {
    state: CompareNavigateState;
}

function defaultUiState(): CompareBlockUiState {
    return {
        keepAdvantages: false,
        showBaseCharacteristics: false,
        hiddenTrimIds: new Set(),
    };
}

const CompareTableView: React.FC<Props> = ({ state }) => {
    const [left, setLeft] = useState<CompareTableSide | null>(null);
    const [right, setRight] = useState<CompareTableSide | null>(null);
    const [loading, setLoading] = useState(true);
    const [leftUi, setLeftUi] = useState<CompareBlockUiState>(() => defaultUiState());
    const [rightUi, setRightUi] = useState<CompareBlockUiState>(() => defaultUiState());

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
                setLeftUi(defaultUiState());
                setRightUi(defaultUiState());
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

    const leftOpponents = useMemo(
        () => ({
            trimIds: rightVisibleTrimIds,
            getOpponentValues: (attributeId: string): (EntityAttributeValue | undefined)[] => {
                if (!right) return [];
                const vals: (EntityAttributeValue | undefined)[] = [];
                for (const trimId of rightVisibleTrimIds) {
                    vals.push(right.valuesByTrimId[trimId]?.[attributeId]);
                }
                const specVal = right.specValuesByAttributeId[attributeId];
                if (specVal) vals.push(specVal);
                return vals;
            },
        }),
        [right, rightVisibleTrimIds],
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
                const specVal = left.specValuesByAttributeId[attributeId];
                if (specVal) vals.push(specVal);
                return vals;
            },
        }),
        [left, leftVisibleTrimIds],
    );

    const patchLeftUi = (patch: Partial<CompareBlockUiState>) =>
        setLeftUi((prev) => ({ ...prev, ...patch }));
    const patchRightUi = (patch: Partial<CompareBlockUiState>) =>
        setRightUi((prev) => ({ ...prev, ...patch }));

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
                    opponents={leftOpponents}
                />
                <Divider
                    type="vertical"
                    style={{ height: 'auto', alignSelf: 'stretch', margin: '0 12px' }}
                />
                <CompareCarBlock
                    side="right"
                    data={right}
                    ui={rightUi}
                    onUiChange={patchRightUi}
                    opponents={rightOpponents}
                />
            </div>
        </div>
    );
};

export default CompareTableView;
