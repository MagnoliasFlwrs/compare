import React, { useEffect } from 'react';
import { App } from 'antd';
import { useDriveTypesStore } from '../stores/driveTypesStore';
import ReferenceAdminPage from '../components/admin/ReferenceAdminPage';

const ManageDriveTypesLayout: React.FC = () => {
    const { message } = App.useApp();

    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const meta = useDriveTypesStore((s) => s.meta);
    const driveTypesObj = useDriveTypesStore((s) => s.driveTypesObj);
    const loading = useDriveTypesStore((s) => s.loading);
    const getDriveTypes = useDriveTypesStore((s) => s.getDriveTypes);
    const createDriveType = useDriveTypesStore((s) => s.createDriveType);
    const updateDriveTypeById = useDriveTypesStore((s) => s.updateDriveTypeById);
    const deleteDriveTypeById = useDriveTypesStore((s) => s.deleteDriveTypeById);

    useEffect(() => {
        getDriveTypes({ page: 1 }).catch(() => {
            message.error('Не удалось загрузить типы привода');
        });
    }, []);

    return (
        <ReferenceAdminPage
            title="Типы привода"
            addTitle="Новый тип привода"
            editTitle={(item) => `Редактирование: ${item.name}`}
            entityLabelGenitive="тип привода"
            items={driveTypes}
            loading={loading}
            meta={meta}
            page={driveTypesObj.page}
            limit={driveTypesObj.limit}
            onPageChange={(page, limit) => {
                getDriveTypes({ page, limit }).catch(() => {
                    message.error('Не удалось загрузить типы привода');
                });
            }}
            onCreate={(name) => createDriveType({ name })}
            onUpdate={(id, name) => updateDriveTypeById(id, { name })}
            onDelete={(id) => deleteDriveTypeById(id)}
        />
    );
};

export default ManageDriveTypesLayout;
