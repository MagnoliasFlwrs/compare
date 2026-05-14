import React, { useEffect } from 'react';
import { App } from 'antd';
import { useTransmissionTypesStore } from '../stores/transmissionTypesStore';
import ReferenceAdminPage from '../components/admin/ReferenceAdminPage';

const ManageTransmissionTypesLayout: React.FC = () => {
    const { message } = App.useApp();

    const transmissionTypes = useTransmissionTypesStore((s) => s.transmissionTypes);
    const meta = useTransmissionTypesStore((s) => s.meta);
    const transmissionTypesObj = useTransmissionTypesStore((s) => s.transmissionTypesObj);
    const loading = useTransmissionTypesStore((s) => s.loading);
    const getTransmissionTypes = useTransmissionTypesStore((s) => s.getTransmissionTypes);
    const createTransmissionType = useTransmissionTypesStore((s) => s.createTransmissionType);
    const updateTransmissionTypeById = useTransmissionTypesStore(
        (s) => s.updateTransmissionTypeById,
    );
    const deleteTransmissionTypeById = useTransmissionTypesStore(
        (s) => s.deleteTransmissionTypeById,
    );

    useEffect(() => {
        getTransmissionTypes({ page: 1 }).catch(() => {
            message.error('Не удалось загрузить типы КПП');
        });
    }, []);

    return (
        <ReferenceAdminPage
            title="Типы КПП"
            addTitle="Новый тип КПП"
            editTitle={(item) => `Редактирование: ${item.name}`}
            entityLabelGenitive="тип КПП"
            items={transmissionTypes}
            loading={loading}
            meta={meta}
            page={transmissionTypesObj.page}
            limit={transmissionTypesObj.limit}
            onPageChange={(page, limit) => {
                getTransmissionTypes({ page, limit }).catch(() => {
                    message.error('Не удалось загрузить типы КПП');
                });
            }}
            onCreate={(name) => createTransmissionType({ name })}
            onUpdate={(id, name) => updateTransmissionTypeById(id, { name })}
            onDelete={(id) => deleteTransmissionTypeById(id)}
        />
    );
};

export default ManageTransmissionTypesLayout;
