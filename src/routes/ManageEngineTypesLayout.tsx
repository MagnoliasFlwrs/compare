import React, { useEffect } from 'react';
import { App } from 'antd';
import { useEngineTypesStore } from '../stores/engineTypesStore';
import ReferenceAdminPage from '../components/admin/ReferenceAdminPage';

const ManageEngineTypesLayout: React.FC = () => {
    const { message } = App.useApp();

    const engineTypes = useEngineTypesStore((s) => s.engineTypes);
    const meta = useEngineTypesStore((s) => s.meta);
    const engineTypesObj = useEngineTypesStore((s) => s.engineTypesObj);
    const loading = useEngineTypesStore((s) => s.loading);
    const getEngineTypes = useEngineTypesStore((s) => s.getEngineTypes);
    const createEngineType = useEngineTypesStore((s) => s.createEngineType);
    const updateEngineTypeById = useEngineTypesStore((s) => s.updateEngineTypeById);
    const deleteEngineTypeById = useEngineTypesStore((s) => s.deleteEngineTypeById);

    useEffect(() => {
        getEngineTypes({ page: 1 }).catch(() => {
            message.error('Не удалось загрузить типы двигателя');
        });
    }, []);

    return (
        <ReferenceAdminPage
            title="Типы двигателя"
            addTitle="Новый тип двигателя"
            editTitle={(item) => `Редактирование: ${item.name}`}
            entityLabelGenitive="тип двигателя"
            items={engineTypes}
            loading={loading}
            meta={meta}
            page={engineTypesObj.page}
            limit={engineTypesObj.limit}
            onPageChange={(page, limit) => {
                getEngineTypes({ page, limit }).catch(() => {
                    message.error('Не удалось загрузить типы двигателя');
                });
            }}
            onCreate={(name) => createEngineType({ name })}
            onUpdate={(id, name) => updateEngineTypeById(id, { name })}
            onDelete={(id) => deleteEngineTypeById(id)}
        />
    );
};

export default ManageEngineTypesLayout;
