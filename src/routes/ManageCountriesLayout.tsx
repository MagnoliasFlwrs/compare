import React, { useEffect } from 'react';
import { App } from 'antd';
import { useCountriesStore } from '../stores/countriesStore';
import ReferenceAdminPage from '../components/admin/ReferenceAdminPage';

const ManageCountriesLayout: React.FC = () => {
    const { message } = App.useApp();

    const countries = useCountriesStore((s) => s.countries);
    const meta = useCountriesStore((s) => s.meta);
    const countriesObj = useCountriesStore((s) => s.countriesObj);
    const loading = useCountriesStore((s) => s.loading);
    const getCountries = useCountriesStore((s) => s.getCountries);
    const createCountry = useCountriesStore((s) => s.createCountry);
    const updateCountryById = useCountriesStore((s) => s.updateCountryById);
    const deleteCountryById = useCountriesStore((s) => s.deleteCountryById);

    useEffect(() => {
        getCountries({ page: 1 }).catch(() => {
            message.error('Не удалось загрузить страны');
        });
    }, []);

    return (
        <ReferenceAdminPage
            title="Страны"
            addTitle="Новая страна"
            editTitle={(item) => `Редактирование: ${item.name}`}
            entityLabelGenitive="страну"
            items={countries}
            loading={loading}
            meta={meta}
            page={countriesObj.page}
            limit={countriesObj.limit}
            onPageChange={(page, limit) => {
                getCountries({ page, limit }).catch(() => {
                    message.error('Не удалось загрузить страны');
                });
            }}
            onCreate={(name) => createCountry({ name })}
            onUpdate={(id, name) => updateCountryById(id, { name })}
            onDelete={(id) => deleteCountryById(id)}
        />
    );
};

export default ManageCountriesLayout;
