import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';

// Hooks
import { useTypification } from '../../hooks/useTypification';

const DEFAULT_DEFICIENCY = {
    defiInterno: 0,
    defiCodigoElemento: '',
    defiTipoElemento: 'POST', // Valor por defecto
    tipiInterno: null,
    defiEstadoCriticidad: 2, // 2: Medio por defecto
    defiNumSuministro: '',
    defiObservacion: '',
    defiDistHorizontal: 0,
    defiDistVertical: 0,
    defiActivo: true,
    defiFecRegistro: null // Se llena al guardar si es nuevo
};

const CRITICIDAD_OPTIONS = [
    { label: 'LEVE', value: 1 },
    { label: 'CRÍTICO', value: 3 }
];

const TIPO_ELEMENTO_OPTIONS = [
    { label: 'POSTE', value: 'POST' },
    { label: 'VANO', value: 'VANO' },
];

export default function DeficiencyForm({ 
    visible, 
    onHide, 
    onSave, 
    deficiencyToEdit, 
    sedId, 
    existingDeficiencies = [] 
}) {
    const [deficiency, setDeficiency] = useState(DEFAULT_DEFICIENCY);
    const [submitted, setSubmitted] = useState(false);
    
    // Hook para llenar el Dropdown de Tipificaciones
    // Se asume que typifications viene como: [{ label: '6002 - Poste Roto', value: 15 }, ...]
    const { typifications, loading: loadingTipos } = useTypification(); 

    // --- EFECTO DE CARGA ---
    useEffect(() => {
        if (visible) {
            if (deficiencyToEdit) {
                setDeficiency({ ...deficiencyToEdit });
            } else {
                // RESET para Nuevo
                setDeficiency({ 
                    ...DEFAULT_DEFICIENCY, 
                    defiCodigoElemento: '', // Limpiar para obligar a escribir
                });
            }
            setSubmitted(false);
        }
    }, [visible, deficiencyToEdit]);

    // --- MANEJO DE CAMBIOS EN INPUTS ---
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setDeficiency(prev => ({ ...prev, [name]: val }));
    };

    const onValueChange = (e, name) => {
        setDeficiency(prev => ({ ...prev, [name]: e.value }));
    };

    // --- VALIDACIONES ---
    const validateForm = () => {
        let isValid = true;
        const ID_PERMITE_DUPLICADOS = 7004; // Regla de Negocio

        // 1. Campos Requeridos
        if (!deficiency.defiCodigoElemento?.trim()) isValid = false;
        if (!deficiency.tipiInterno) isValid = false;

        // 2. Validar Duplicados (Solo en creación)
        if (!deficiencyToEdit) {
            // Excepción: Si es la tipificación 7004, permitimos duplicados.
            if (deficiency.tipiInterno !== ID_PERMITE_DUPLICADOS) {
                const isDuplicate = existingDeficiencies.some(d => 
                    (d.defiActivo === 1 || d.defiActivo === true) && // Solo activas
                    d.defiCodigoElemento === deficiency.defiCodigoElemento && // Mismo Elemento
                    d.tipiInterno === deficiency.tipiInterno // Misma Tipificación
                );

                if (isDuplicate) {
                    alert(`Ya existe una deficiencia activa de este tipo para el elemento ${deficiency.defiCodigoElemento}.`);
                    return false;
                }
            }
        }

        return isValid;
    };

    const handleSubmit = () => {
        setSubmitted(true);

        if (validateForm()) {
            // Preparar Payload Final
            const payload = {
                ...deficiency,
                // REGLA: Si es nuevo, el estado es 'N' (Nuevo/Pendiente)
                defiEstado: deficiencyToEdit ? deficiency.defiEstado : 'N',
                // Asegurar numéricos
                tipiInterno: Number(deficiency.tipiInterno),
                defiDistHorizontal: Number(deficiency.defiDistHorizontal) || 0,
                defiDistVertical: Number(deficiency.defiDistVertical) || 0,
                // Fecha registro si es nuevo
                defiFecRegistro: deficiencyToEdit ? deficiency.defiFecRegistro : new Date().toISOString()
            };

            onSave(payload);
        }
    };

    // --- FOOTER DEL MODAL ---
    const formFooter = (
        <div className="flex justify-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={onHide} className="p-button-secondary" />
            <Button label="Guardar" icon="pi pi-check" onClick={handleSubmit} autoFocus />
        </div>
    );

    return (
        <Dialog 
            visible={visible} 
            style={{ width: '600px' }} 
            header={deficiencyToEdit ? "Editar Deficiencia" : `Nueva Deficiencia (SED: ${sedId})`} 
            modal 
            className="p-fluid" 
            footer={formFooter} 
            onHide={onHide}
        >
            <div className="grid grid-cols-1 gap-4 mt-2">
                
                {/* SECCIÓN 1: ELEMENTO */}
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación y Elemento</span>
                    <Divider className="my-2" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="field">
                            <label htmlFor="tipoElemento" className="font-bold">Tipo</label>
                            <Dropdown 
                                id="tipoElemento" 
                                value={deficiency.defiTipoElemento} 
                                options={TIPO_ELEMENTO_OPTIONS} 
                                onChange={(e) => onValueChange(e, 'defiTipoElemento')} 
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="codigoElemento" className="font-bold">Código GIS / Elemento</label>
                            <InputText 
                                id="codigoElemento" 
                                value={deficiency.defiCodigoElemento} 
                                onChange={(e) => onInputChange(e, 'defiCodigoElemento')} 
                                required 
                                className={classNames({ 'p-invalid': submitted && !deficiency.defiCodigoElemento })}
                                placeholder="Ej. P123456"
                            />
                            {submitted && !deficiency.defiCodigoElemento && <small className="p-error">Requerido.</small>}
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: DETALLE TÉCNICO */}
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalle de la Deficiencia</span>
                    <Divider className="my-2" />

                    <div className="field mb-4">
                        <label htmlFor="tipificacion" className="font-bold">Tipificación (Defecto)</label>
                        <Dropdown 
                            id="tipificacion" 
                            value={deficiency.tipiInterno} 
                            options={typifications} 
                            optionLabel="label" 
                            optionValue="value"
                            onChange={(e) => onValueChange(e, 'tipiInterno')} 
                            placeholder={loadingTipos ? "Cargando..." : "Seleccione..."}
                            className={classNames({ 'p-invalid': submitted && !deficiency.tipiInterno })}
                            filter
                        />
                        {submitted && !deficiency.tipiInterno && <small className="p-error">Seleccione una tipificación.</small>}
                        
                        {/* Mensaje informativo para código 7004 */}
                        {deficiency.tipiInterno === 7004 && (
                            <small className="text-blue-600 block mt-1"><i className="pi pi-info-circle"></i> Permite múltiples registros.</small>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="field">
                            <label htmlFor="criticidad">Criticidad</label>
                            <Dropdown 
                                id="criticidad" 
                                value={deficiency.defiEstadoCriticidad} 
                                options={CRITICIDAD_OPTIONS} 
                                onChange={(e) => onValueChange(e, 'defiEstadoCriticidad')} 
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="distH">Dist. Horiz. (m)</label>
                            <InputNumber 
                                id="distH" 
                                value={deficiency.defiDistHorizontal} 
                                onValueChange={(e) => onValueChange(e, 'defiDistHorizontal')} 
                                mode="decimal" minFractionDigits={2} maxFractionDigits={2} min={0} showButtons
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="distV">Dist. Vert. (m)</label>
                            <InputNumber 
                                id="distV" 
                                value={deficiency.defiDistVertical} 
                                onValueChange={(e) => onValueChange(e, 'defiDistVertical')} 
                                mode="decimal" minFractionDigits={2} maxFractionDigits={2} min={0} showButtons
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 3: EXTRAS */}
                <div className="field">
                    <label htmlFor="suministro">Suministro (Opcional)</label>
                    <InputText 
                        id="suministro" 
                        value={deficiency.defiNumSuministro} 
                        onChange={(e) => onInputChange(e, 'defiNumSuministro')} 
                        keyfilter="int"
                    />
                </div>

                <div className="field">
                    <label htmlFor="observacion">Observaciones</label>
                    <InputTextarea 
                        id="observacion" 
                        value={deficiency.defiObservacion} 
                        onChange={(e) => onInputChange(e, 'defiObservacion')} 
                        rows={3} autoResize 
                    />
                </div>
            </div>
        </Dialog>
    );
}