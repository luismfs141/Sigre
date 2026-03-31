import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';

import { useFeeder } from '../hooks/useFeeder';
import { useSed } from '../hooks/useSed';
import { useFiles } from '../hooks/useFiles';

export default function MigrationPanel() {

    const [archivos, setArchivos] = useState([]);
    const [selectedArchivos, setSelectedArchivos] = useState([]);

    const [loading, setLoading] = useState(false);
    const [filtrosLoading, setFiltrosLoading] = useState(false);

    const [seds, setSeds] = useState([]);
    const [rutaOrigen, setRutaOrigen] = useState('');

    const [visibleDialog, setVisibleDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const inputFolderRef = useRef(null);
    const toast = useRef(null);

    const { feeders, loading: feedersLoading } = useFeeder();
    const { getSedsByFeeder, loading: sedsLoading } = useSed();
    const { getFileStructBySeds } = useFiles();

    const [filtro, setFiltro] = useState({
        alim: null,
        sed: null,
        elemento: ''
    });

    useEffect(() => {
        loadCombos();
    }, []);

    const loadCombos = async () => {
        try {
            const res = await fetch('/api/filtros');
            const data = await res.json();
            setSeds(data.seds);
        } catch {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error cargando filtros'
            });
        }
    };

    const handleChangeAlim = async (e) => {
        const value = e.value;

        setFiltro({
            ...filtro,
            alim: value,
            sed: null
        });

        const data = await getSedsByFeeder(value);
        setSeds(data);
    };

    const buscarArchivos = async () => {

        if (!filtro.sed) {
            toast.current.show({
                severity: 'warn',
                summary: 'Filtro requerido',
                detail: 'Selecciona una SED'
            });
            return;
        }

        setFiltrosLoading(true);

        try {
            const data = await getFileStructBySeds([filtro.sed]);
            setArchivos(data);
            setSelectedArchivos([]);
        } catch {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al buscar archivos'
            });
        } finally {
            setFiltrosLoading(false);
        }
    };

    const seleccionarCarpeta = (e) => {
        const files = e.target.files;

        if (files.length > 0) {
            const fullPath = files[0].webkitRelativePath;
            const folder = fullPath.split('/')[0];

            setRutaOrigen(folder);

            toast.current.show({
                severity: 'info',
                summary: 'Carpeta seleccionada',
                detail: folder
            });
        }
    };

    const flattenFiles = (lista) => {
        return lista.flatMap(item => item.archivos || []);
    };

    const subirAWS = async () => {

        const lista = selectedArchivos.length > 0 ? selectedArchivos : archivos;

        if (!rutaOrigen) {
            toast.current.show({
                severity: 'warn',
                summary: 'Ruta requerida',
                detail: 'Selecciona una carpeta raíz'
            });
            return;
        }

        if (lista.length === 0) {
            toast.current.show({
                severity: 'warn',
                summary: 'Sin datos',
                detail: 'No hay archivos para subir'
            });
            return;
        }

        const payload = flattenFiles(lista);

        setLoading(true);

        try {
            const response = await fetch(`/api/File/MigrarAWS?rutaOrigen=${rutaOrigen}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            toast.current.show({
                severity: 'success',
                summary: 'Completado',
                detail: `Migrados: ${result.length}`,
                life: 4000
            });

        } catch {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error en migración AWS'
            });
        } finally {
            setLoading(false);
        }
    };

    // 👉 abrir modal
    const verArchivos = (rowData) => {
        setSelectedItem(rowData);
        setVisibleDialog(true);
    };

    // 👉 template columna
    const archivosTemplate = (rowData) => {
        const count = rowData.archivos?.length || 0;

        return (
            <Button
                label={`Ver Archivos (${count})`}
                icon="pi pi-folder-open"
                className="p-button-text"
                onClick={() => verArchivos(rowData)}
            />
        );
    };

    return (
        <div className="p-m-4">
            <Toast ref={toast} />

            <Card title="Migración AWS S3">

                {/* FILTROS */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>

                    <Dropdown
                        value={filtro.alim}
                        options={feeders}
                        onChange={handleChangeAlim}
                        placeholder="Alimentador"
                        optionLabel="label"
                        optionValue="value"
                        filter
                        showClear
                        loading={feedersLoading}
                        style={{ width: '300px' }}
                    />

                    <Dropdown
                        value={filtro.sed}
                        options={seds}
                        onChange={(e) => setFiltro({ ...filtro, sed: e.value })}
                        placeholder="SED"
                        optionLabel="sedCodigo"
                        optionValue="sedInterno"
                        filter
                        showClear
                        loading={sedsLoading}
                        disabled={!filtro.alim}
                        style={{ width: '200px' }}
                    />

                    <InputText
                        value={filtro.elemento}
                        onChange={(e) => setFiltro({ ...filtro, elemento: e.target.value })}
                        placeholder="Código elemento"
                        style={{ width: '180px' }}
                    />

                    <Button
                        label="Buscar"
                        icon="pi pi-search"
                        onClick={buscarArchivos}
                        loading={filtrosLoading}
                    />

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>

                        <Button
                            label="Carpeta"
                            icon="pi pi-folder-open"
                            className="p-button-secondary"
                            onClick={() => inputFolderRef.current.click()}
                        />

                        <small>{rutaOrigen || 'Sin carpeta'}</small>

                        <Button
                            label="Subir AWS"
                            icon="pi pi-cloud-upload"
                            onClick={subirAWS}
                            loading={loading}
                            className="p-button-success"
                        />

                        <input
                            type="file"
                            ref={inputFolderRef}
                            style={{ display: 'none' }}
                            webkitdirectory="true"
                            directory=""
                            onChange={seleccionarCarpeta}
                        />
                    </div>
                </div>

                {/* TABLA */}
                <DataTable
                    value={archivos}
                    loading={filtrosLoading}
                    paginator rows={10}
                    responsiveLayout="scroll"
                    selection={selectedArchivos}
                    onSelectionChange={(e) => setSelectedArchivos(e.value)}
                    dataKey="idElemento"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    <Column field="idElemento" header="ID Elemento" />
                    <Column field="tipoElemento" header="Tipo" />
                    <Column field="codigoElemento" header="Código" />
                    <Column field="codigoTipificacion" header="Tipificación" />

                    {/* NUEVA COLUMNA */}
                    <Column header="Archivos" body={archivosTemplate} />

                    <Column field="estado" header="Estado" />
                </DataTable>

                {/* MODAL */}
                <Dialog
                    header={`Archivos - ${selectedItem?.codigoElemento || ''}`}
                    visible={visibleDialog}
                    style={{ width: '60vw' }}
                    onHide={() => setVisibleDialog(false)}
                >
                    {selectedItem && (
                        <DataTable value={selectedItem.archivos} responsiveLayout="scroll">
                            <Column field="archNombre" header="Ruta" />
                            <Column field="archTipo" header="Tipo" />
                            <Column field="archActivo" header="Estado" />
                        </DataTable>
                    )}
                </Dialog>

                <div style={{ marginTop: '10px' }}>
                    <small>Seleccionados: {selectedArchivos.length}</small>
                </div>

            </Card>
        </div>
    );
}