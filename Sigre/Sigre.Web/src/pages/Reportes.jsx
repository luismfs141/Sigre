import React, { useState, useEffect } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useFeeder } from '../hooks/useFeeder'; // 👈 Tu hook

export default function FeederTablePrime() {
    // 1. Obtener datos de tu API
    const { feeders, loading } = useFeeder(null, { autoFetch: true });

    const [filters, setFilters] = useState(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    // 2. Configuración inicial de filtros (Solo para tus campos)
    useEffect(() => {
        initFilters();
    }, []);

    const initFilters = () => {
        setFilters({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            
            // Filtro para el Nombre (alimEtiqueta)
            alimEtiqueta: { 
                operator: FilterOperator.AND, 
                constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] 
            },
            
            // Filtro para el Código (alimCodigo)
            alimCodigo: { 
                operator: FilterOperator.AND, 
                constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] 
            },

            // Filtro para ID interno (alimInterno)
            alimInterno: { 
                value: null, 
                matchMode: FilterMatchMode.EQUALS 
            }
        });
        setGlobalFilterValue('');
    };

    const clearFilter = () => {
        initFilters();
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    // 3. Renderizado del Encabezado (Buscador Global)
    const renderHeader = () => {
        return (
            <div className="flex justify-content-between items-center gap-4 mb-4">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined onClick={clearFilter} />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Búsqueda general..." />
                </span>
            </div>
        );
    };

    // 4. Templates para columnas personalizadas
    const statusBodyTemplate = (rowData) => {
        // Asumiendo que alimActivo es booleano o 1/0
        const isActive = rowData.alimActivo === true || rowData.alimActivo === 1;
        return <Tag value={isActive ? 'Activo' : 'Inactivo'} severity={isActive ? 'success' : 'danger'} />;
    };

    const header = renderHeader();

    return (
        <div className="card p-4">
            <h2 className="text-xl font-bold mb-4">Listado de Alimentadores (PrimeReact)</h2>
            
            <DataTable 
                value={feeders} 
                paginator 
                rows={10} 
                loading={loading} 
                dataKey="alimInterno" 
                filters={filters} 
                globalFilterFields={['alimEtiqueta', 'alimCodigo', 'alimInterno']} // 👈 Campos donde busca el buscador general
                header={header} 
                emptyMessage="No se encontraron alimentadores."
                showGridlines
                stripedRows
            >
                {/* COLUMNA: ID */}
                <Column 
                    field="alimInterno" 
                    header="ID Interno" 
                    sortable 
                    filter 
                    filterPlaceholder="Buscar por ID" 
                    style={{ minWidth: '10rem' }} 
                />

                {/* COLUMNA: CÓDIGO */}
                <Column 
                    field="alimCodigo" 
                    header="Código" 
                    sortable 
                    filter 
                    filterPlaceholder="Buscar código" 
                    style={{ minWidth: '12rem' }} 
                />

                {/* COLUMNA: NOMBRE / ETIQUETA */}
                <Column 
                    field="alimEtiqueta" 
                    header="Nombre / Etiqueta" 
                    sortable 
                    filter 
                    filterPlaceholder="Buscar nombre" 
                    style={{ minWidth: '14rem' }} 
                />

                {/* COLUMNA: ESTADO (Calculada) */}
                <Column 
                    header="Estado" 
                    body={statusBodyTemplate} 
                    style={{ minWidth: '10rem' }} 
                />

            </DataTable>
        </div>
    );
}