/**
 * Результат группового сравнения: карточка на каждый выбранный автомобиль.
 */
import React, { useEffect, useState } from 'react';
import { Flex, Spin, Typography } from 'antd';
import type { CompareSideSelection } from '../../types/compare';
import { loadCompareSideData, type CompareSideData } from '../../utils/compare/loadCompareSideData';
import CompareSidePanel from './CompareSidePanel';
import './groupCompare.css';

interface Props {
    items: CompareSideSelection[];
}

type SlotState = {
    selection: CompareSideSelection;
    data: CompareSideData | null;
    loading: boolean;
};

const GroupCompareView: React.FC<Props> = ({ items }) => {
    const [slots, setSlots] = useState<SlotState[]>(() =>
        items.map((selection) => ({ selection, data: null, loading: true })),
    );

    useEffect(() => {
        let cancelled = false;

        setSlots(items.map((selection) => ({ selection, data: null, loading: true })));

        items.forEach((selection, index) => {
            loadCompareSideData(selection)
                .then((data) => {
                    if (cancelled) return;
                    setSlots((prev) => {
                        const next = [...prev];
                        if (next[index]?.selection === selection) {
                            next[index] = { selection, data, loading: false };
                        }
                        return next;
                    });
                })
                .catch(() => {
                    if (cancelled) return;
                    setSlots((prev) => {
                        const next = [...prev];
                        if (next[index]?.selection === selection) {
                            next[index] = {
                                selection,
                                data: { selection, title: '', blocks: [] },
                                loading: false,
                            };
                        }
                        return next;
                    });
                });
        });

        return () => {
            cancelled = true;
        };
    }, [items]);

    return (
        <div className="group-compare-result">
            {slots.map((slot, index) => (
                <div
                    key={`${slot.selection.brandId}-${slot.selection.modelId}-${slot.selection.generationId ?? 'all'}-${index}`}
                    className="group-compare-card"
                >
                    <CompareSidePanel data={slot.data} loading={slot.loading} />
                </div>
            ))}
            {slots.length === 0 ? (
                <Typography.Text type="secondary">Нет автомобилей для сравнения</Typography.Text>
            ) : null}
        </div>
    );
};

export default GroupCompareView;
