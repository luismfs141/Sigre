import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';

export default function MigrationPanel() {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingErrors, setFetchingErrors] = useState(false);
    const toast = useRef(null);

    // Función para cargar la tabla de errores
    const loadErrors = async () => {
        setFetchingErrors(true);
        try {
            // Reemplaza con tu endpoint real
            const response = await fetch('/api/migration/errors');
            const data = await response.json();
            setErrors(data);
        } catch (error) {
            console.error("Error al cargar errores:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los registros fallidos.', life: 3000 });
        } finally {
            setFetchingErrors(false);
        }
    };

    // Cargar errores al montar el componente
    useEffect(() => {
        loadErrors();
    }, []);

    // Función para disparar la migración masiva
    const handleStartMigration = async () => {
        setLoading(true);
        try {
            // Reemplaza con tu endpoint real
            const response = await fetch('/api/migration/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                toast.current.show({ severity: 'success', summary: 'Iniciado', detail: 'La migración se está ejecutando en segundo plano.', life: 5000 });
            } else {
                toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'La migración ya está en curso o hubo un problema.', life: 5000 });
            }
        } catch (error) {
            console.error("Error al iniciar migración:", error);
            toast.current.show({ severity: 'error', summary: 'Error de Red', detail: 'No se pudo contactar al servidor.', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Plantilla para mostrar filas vacías de forma amigable si no hay errores
    const emptyMessage = "No se encontraron errores. Todo está sincronizado correctamente.";

    return (
        <div className="p-m-4">
            <Toast ref={toast} />
            
            <Card title="Migración Masiva a AWS S3" subTitle="Sincronización de fotos pendientes" className="p-mb-4">
                <p className="p-m-0 p-mb-3">
                    Al iniciar, el servidor buscará todas las fotos con estado PENDIENTE y las subirá a S3 en lotes. 
                    Puedes cerrar esta ventana; el proceso continuará en el servidor.
                </p>
                <Button 
                    label={loading ? "Iniciando..." : "Iniciar Sincronización"} 
                    icon={loading ? "pi pi-spin pi-spinner" : "pi pi-cloud-upload"} 
                    onClick={handleStartMigration} 
                    disabled={loading}
                    className="p-button-primary" 
                />
            </Card>

            <Card title="Reporte de Errores" subTitle="Fotos que no pudieron ser migradas">
                <div className="p-d-flex p-jc-end p-mb-2">
                    <Button icon="pi pi-refresh" className="p-button-rounded p-button-text" onClick={loadErrors} tooltip="Actualizar tabla" />
                </div>
                <DataTable 
                    value={errors} 
                    loading={fetchingErrors} 
                    emptyMessage={emptyMessage} 
                    paginator rows={10} 
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    responsiveLayout="scroll"
                >
                    <Column field="ARCH_Interno" header="ID Interno" sortable></Column>
                    <Column field="DEFI_UUID" header="UUID Deficiencia" sortable></Column>
                    <Column field="ErrorMessage" header="Mensaje de Error AWS"></Column>
                    <Column field="FechaLog" header="Fecha de Error" sortable></Column>
                </DataTable>
            </Card>
        </div>
    );
}