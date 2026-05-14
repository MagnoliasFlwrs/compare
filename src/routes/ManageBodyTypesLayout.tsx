import React, { useEffect } from 'react';
import { App } from 'antd';
import { useBodyTypesStore } from '../stores/bodyTypesStore';
import ReferenceAdminPage from '../components/admin/ReferenceAdminPage';

const ManageBodyTypesLayout: React.FC = () => {
    const { message } = App.useApp();

    const bodyTypes = useBodyTypesStore((s) => s.bodyTypes);
    const meta = useBodyTypesStore((s) => s.meta);
    const bodyTypesObj = useBodyTypesStore((s) => s.bodyTypesObj);
    const loading = useBodyTypesStore((s) => s.loading);
    const getBodyTypes = useBodyTypesStore((s) => s.getBodyTypes);
    const createBodyType = useBodyTypesStore((s) => s.createBodyType);
    const updateBodyTypeById = useBodyTypesStore((s) => s.updateBodyTypeById);
    const deleteBodyTypeById = useBodyTypesStore((s) => s.deleteBodyTypeById);

    useEffect(() => {
        getBodyTypes({ page: 1 }).catch(() => {
            message.error('Не удалось загрузить типы кузова');
        });
    }, []);

    return (
        <ReferenceAdminPage
            title="Типы кузова"
            addTitle="Новый тип кузова"
            editTitle={(item) => `Редактирование: ${item.name}`}
            entityLabelGenitive="тип кузова"
            items={bodyTypes}
            loading={loading}
            meta={meta}
            page={bodyTypesObj.page}
            limit={bodyTypesObj.limit}
            onPageChange={(page, limit) => {
                getBodyTypes({ page, limit }).catch(() => {
                    message.error('Не удалось загрузить типы кузова');
                });
            }}
            onCreate={(name) => createBodyType({ name })}
            onUpdate={(id, name) => updateBodyTypeById(id, { name })}
            onDelete={(id) => deleteBodyTypeById(id)}
        />
    );
};

export default ManageBodyTypesLayout;
