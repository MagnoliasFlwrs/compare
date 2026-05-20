import React, { useEffect, useMemo, useState } from 'react';
import { App, Flex, Select, Typography } from 'antd';
import type { Brand } from '../../stores/brandsStore';
import type { Model } from '../../stores/modelsStore';
import type { Generation } from '../../types/generation';
import type { Powertrain } from '../../stores/powertrainStore';
import type { Trim } from '../../stores/trimsStore';
import type { CompareSideDraft } from '../../types/compare';
import { baseAuthUrl } from '../../store';
import { fetchAllPages } from '../../utils/paginatedFetch';

interface Props {
    title: string;
    value: CompareSideDraft;
    onChange: (next: CompareSideDraft) => void;
}

function generationLabel(g: Generation): string {
    const years = `${g.yearFrom}–${g.yearTo || '…'}`;
    return `Поколение #${g.number}${g.restyling ? ` (${g.restyling})` : ''} · ${years}`;
}

const labelWithRequired = (text: string, required: boolean) => (
    <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
        <Typography.Text>{text}</Typography.Text>
        {required ? (
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ff4d4f',
                    display: 'inline-block',
                }}
                title="Обязательное поле"
            />
        ) : null}
    </Flex>
);

const CarSelectorColumn: React.FC<Props> = ({ title, value, onChange }) => {
    const { message } = App.useApp();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [powertrains, setPowertrains] = useState<Powertrain[]>([]);
    const [trims, setTrims] = useState<Trim[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingGenerations, setLoadingGenerations] = useState(false);
    const [loadingPowertrains, setLoadingPowertrains] = useState(false);
    const [loadingTrims, setLoadingTrims] = useState(false);

    useEffect(() => {
        setLoadingBrands(true);
        fetchAllPages<Brand>(`${baseAuthUrl}/brands`, {})
            .then((list) => setBrands(list.filter((b) => !b.isHidden).sort((a, b) => a.name.localeCompare(b.name, 'ru'))))
            .catch(() => message.error('Не удалось загрузить бренды'))
            .finally(() => setLoadingBrands(false));
    }, [message]);

    useEffect(() => {
        if (!value.brandId) {
            setModels([]);
            return;
        }
        setLoadingModels(true);
        fetchAllPages<Model>(`${baseAuthUrl}/models`, { brandId: value.brandId })
            .then((list) =>
                setModels(list.filter((m) => !m.isHidden).sort((a, b) => a.name.localeCompare(b.name, 'ru'))),
            )
            .catch(() => message.error('Не удалось загрузить модели'))
            .finally(() => setLoadingModels(false));
    }, [value.brandId, message]);

    useEffect(() => {
        if (!value.modelId) {
            setGenerations([]);
            return;
        }
        setLoadingGenerations(true);
        fetchAllPages<Generation>(`${baseAuthUrl}/generations`, {
            modelId: value.modelId,
        })
            .then((list) =>
                setGenerations(list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))),
            )
            .catch(() => message.error('Не удалось загрузить поколения'))
            .finally(() => setLoadingGenerations(false));
    }, [value.modelId, message]);

    useEffect(() => {
        if (!value.generationId) {
            setPowertrains([]);
            setTrims([]);
            return;
        }
        setLoadingPowertrains(true);
        setLoadingTrims(true);
        Promise.all([
            fetchAllPages<Powertrain>(`${baseAuthUrl}/powertrains`, {
                filter: { generationId: value.generationId },
            }),
            fetchAllPages<Trim>(`${baseAuthUrl}/trims`, {
                filter: { generationId: value.generationId },
            }),
        ])
            .then(([pt, tr]) => {
                setPowertrains(
                    pt.filter((p) => !p.isHidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
                );
                setTrims(tr.filter((t) => !t.isHidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
            })
            .catch(() => message.error('Не удалось загрузить комплектации'))
            .finally(() => {
                setLoadingPowertrains(false);
                setLoadingTrims(false);
            });
    }, [value.generationId, message]);

    const patch = (partial: Partial<CompareSideDraft>) => onChange({ ...value, ...partial });

    const brandOptions = useMemo(
        () => brands.map((b) => ({ value: b.id, label: b.name })),
        [brands],
    );
    const modelOptions = useMemo(
        () => models.map((m) => ({ value: m.id, label: m.name })),
        [models],
    );
    const generationOptions = useMemo(
        () => generations.map((g) => ({ value: g.id, label: generationLabel(g) })),
        [generations],
    );
    const powertrainOptions = useMemo(
        () => powertrains.map((p) => ({ value: p.id, label: p.name || p.engine || p.id.slice(0, 8) })),
        [powertrains],
    );
    const trimOptions = useMemo(
        () => trims.map((t) => ({ value: t.id, label: t.name })),
        [trims],
    );

    return (
        <Flex vertical gap={16} style={{ flex: 1, minWidth: 280 }}>
            <Typography.Title level={5} style={{ margin: 0, textAlign: 'center' }}>
                {title}
            </Typography.Title>

            <div>
                {labelWithRequired('Бренд', true)}
                <Select
                    showSearch
                    allowClear
                    placeholder="Выберите бренд"
                    style={{ width: '100%' }}
                    loading={loadingBrands}
                    options={brandOptions}
                    value={value.brandId}
                    optionFilterProp="label"
                    onChange={(id, opt) =>
                        patch({
                            brandId: id,
                            brandName: (opt as { label?: string })?.label ?? '',
                            modelId: undefined,
                            modelName: undefined,
                            generationId: undefined,
                            generationLabel: undefined,
                            powertrainId: undefined,
                            powertrainLabel: undefined,
                            trimId: undefined,
                            trimLabel: undefined,
                        })
                    }
                />
            </div>

            <div>
                {labelWithRequired('Модель', true)}
                <Select
                    showSearch
                    allowClear
                    disabled={!value.brandId}
                    placeholder="Выберите модель"
                    style={{ width: '100%' }}
                    loading={loadingModels}
                    options={modelOptions}
                    value={value.modelId}
                    optionFilterProp="label"
                    onChange={(id, opt) =>
                        patch({
                            modelId: id,
                            modelName: (opt as { label?: string })?.label ?? '',
                            generationId: undefined,
                            generationLabel: undefined,
                            powertrainId: undefined,
                            powertrainLabel: undefined,
                            trimId: undefined,
                            trimLabel: undefined,
                        })
                    }
                />
            </div>

            <div>
                {labelWithRequired('Поколение', false)}
                <Select
                    showSearch
                    allowClear
                    disabled={!value.modelId}
                    placeholder="Все поколения"
                    style={{ width: '100%' }}
                    loading={loadingGenerations}
                    options={generationOptions}
                    value={value.generationId}
                    optionFilterProp="label"
                    onChange={(id, opt) =>
                        patch({
                            generationId: id,
                            generationLabel: (opt as { label?: string })?.label,
                            powertrainId: undefined,
                            powertrainLabel: undefined,
                            trimId: undefined,
                            trimLabel: undefined,
                        })
                    }
                />
            </div>

            <Flex gap={12}>
                <div style={{ flex: 1 }}>
                    {labelWithRequired('Силовой агрегат', false)}
                    <Select
                        showSearch
                        allowClear
                        disabled={!value.generationId}
                        placeholder="Все"
                        style={{ width: '100%' }}
                        loading={loadingPowertrains}
                        options={powertrainOptions}
                        value={value.powertrainId}
                        optionFilterProp="label"
                        onChange={(id, opt) =>
                            patch({
                                powertrainId: id,
                                powertrainLabel: (opt as { label?: string })?.label,
                            })
                        }
                    />
                </div>
                <div style={{ flex: 1 }}>
                    {labelWithRequired('Комплектация', false)}
                    <Select
                        showSearch
                        allowClear
                        disabled={!value.generationId}
                        placeholder="Все"
                        style={{ width: '100%' }}
                        loading={loadingTrims}
                        options={trimOptions}
                        value={value.trimId}
                        optionFilterProp="label"
                        onChange={(id, opt) =>
                            patch({
                                trimId: id,
                                trimLabel: (opt as { label?: string })?.label,
                            })
                        }
                    />
                </div>
            </Flex>
        </Flex>
    );
};

export default CarSelectorColumn;
