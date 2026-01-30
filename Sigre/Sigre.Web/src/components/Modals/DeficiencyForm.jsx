import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';
import { Calendar } from 'primereact/calendar';

import { useTypification } from '../../hooks/useTypification';
import { DEFICIENCY_FIELD_MAP } from '../../utils/deficiencyFormUtils';

const TIPO_ELEMENTO_OPTIONS = [
    { label: 'POSTE', value: 'POST' },
    { label: 'VANO', value: 'VANO' },
];

// Opciones base de criticidad
const ALL_CRITICIDAD_OPTIONS = [
    { label: 'LEVE', value: 1 },
    { label: 'MEDIO', value: 2 },
    { label: 'CRÍTICO', value: 3 }
];

export default function DeficiencyForm({ 
    visible, onHide, onSave, deficiencyToEdit, sedId, existingDeficiencies = [] 
}) {
    const [formData, setFormData] = useState({});
    const [submitted, setSubmitted] = useState(false);
    
    const { getTypificationsByElement, getCodeById, loading: loadingTipos } = useTypification(); 

    // --- 1. LÓGICA DE CRITICIDAD DINÁMICA ---
    const criticidadOptions = useMemo(() => {
        // Regla: Para EDICIÓN existen las 3 opciones. Para NUEVO, no existe MEDIO.
        if (deficiencyToEdit) {
            return ALL_CRITICIDAD_OPTIONS;
        }
        // Filtramos "MEDIO" (valor 2) para nuevos registros
        return ALL_CRITICIDAD_OPTIONS.filter(opt => opt.value !== 2);
    }, [deficiencyToEdit]);

    // --- 2. INICIALIZACIÓN ---
    useEffect(() => {
        if (visible) {
            if (deficiencyToEdit) {
                // MODO EDICIÓN
                setFormData({
                    ...deficiencyToEdit,
                    DefiCodigoElemento: deficiencyToEdit.defiCodigoElemento,
                    DefiTipoElemento: deficiencyToEdit.defiTipoElemento,
                    tipiInterno: Number(deficiencyToEdit.tipiInterno),
                    DefiFecRegistro: deficiencyToEdit.defiFecRegistro ? new Date(deficiencyToEdit.defiFecRegistro) : new Date(),
                    
                    DefiDistHorizontal: deficiencyToEdit.defiDistHorizontal,
                    DefiDistVertical: deficiencyToEdit.defiDistVertical,
                    DefiAccesibilidad: deficiencyToEdit.defiAccesibilidad,
                    DefiNumSuministro: deficiencyToEdit.defiNumSuministro,
                    DefiObservacion: deficiencyToEdit.defiObservacion || '',
                    DefiComentario: deficiencyToEdit.defiComentario || '',
                    DefiEstadoCriticidad: deficiencyToEdit.defiEstadoCriticidad,
                    DefiLatitud: deficiencyToEdit.defiLatitud,
                    DefiLongitud: deficiencyToEdit.defiLongitud,
                    DefiTipoCruce: deficiencyToEdit.defiTipoCruce
                });
            } else {
                // MODO NUEVO
                setFormData({
                    DefiCodigoElemento: '',
                    DefiTipoElemento: 'POST', 
                    DefiEstado: 'N',
                    sedCodigo: sedId,
                    DefiFecRegistro: new Date(),
                    DefiLatitud: 0,
                    DefiLongitud: 0,
                    DefiObservacion: '',
                    // Default a LEVE (1) porque MEDIO (2) ya no existe en nuevos
                    DefiEstadoCriticidad: 1 
                });
                
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (p) => setFormData(prev => ({ ...prev, DefiLatitud: p.coords.latitude, DefiLongitud: p.coords.longitude })),
                        (e) => console.warn("GPS Error", e),
                        { enableHighAccuracy: true }
                    );
                }
            }
            setSubmitted(false);
        }
    }, [visible, deficiencyToEdit, sedId]);

    const currentConfig = useMemo(() => {
        if (!formData.tipiInterno) return null;
        const code = getCodeById(formData.tipiInterno);
        return DEFICIENCY_FIELD_MAP[code] || null;
    }, [formData.tipiInterno, getCodeById]);

    const typificationOptions = useMemo(() => {
        return getTypificationsByElement(null);
    }, [getTypificationsByElement]);

    // --- MANEJADORES ---
    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // --- VALIDACIÓN ---
    const validateDynamicForm = () => {
        if (!currentConfig) return true; 
        const errors = [];
        
        currentConfig.fields.forEach(field => {
            if (field.readonly) return;
            const value = formData[field.key];

            if (field.required && (value === null || value === undefined || value === '')) {
                errors.push(`El campo "${field.label}" es obligatorio.`);
                return;
            }

            if (field.validation) {
                if (field.type === 'number') {
                    if (field.validation.max !== undefined && Number(value) > field.validation.max) {
                        errors.push(field.validation.message || `${field.label} excede el máximo permitido.`);
                    }
                }
                if (field.validation.custom) {
                    const errorMsg = field.validation.custom(value, formData);
                    if (errorMsg) errors.push(errorMsg);
                }
            }
        });

        if (errors.length > 0) {
            alert("Errores:\n" + errors.map(e => "• " + e).join("\n"));
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        setSubmitted(true);
        
        if (!formData.DefiCodigoElemento?.trim() || !formData.tipiInterno) return;

        if (!deficiencyToEdit && formData.tipiInterno !== 7004) {
            const isDup = existingDeficiencies.some(d => 
                (d.defiActivo) && 
                d.defiCodigoElemento === formData.DefiCodigoElemento && 
                d.tipiInterno === formData.tipiInterno
            );
            if (isDup) { alert("Ya existe este defecto activo."); return; }
        }

        if (!validateDynamicForm()) return;

        const now = new Date();
        const payload = {
            defiInterno: deficiencyToEdit ? deficiencyToEdit.defiInterno : 0,
            defiCodigoElemento: formData.DefiCodigoElemento,
            defiTipoElemento: formData.DefiTipoElemento,
            tipiInterno: formData.tipiInterno,
            defiEstado: deficiencyToEdit ? deficiencyToEdit.defiEstado : 'N',
            sedCodigo: sedId,
            
            defiDistHorizontal: Number(formData.DefiDistHorizontal) || 0,
            defiDistVertical: Number(formData.DefiDistVertical) || 0,
            defiAccesibilidad: formData.DefiAccesibilidad,
            defiNumSuministro: formData.DefiNumSuministro,
            defiObservacion: formData.DefiObservacion,
            defiComentario: formData.DefiComentario,
            defiEstadoCriticidad: formData.DefiEstadoCriticidad,
            defiTipoCruce: formData.DefiTipoCruce,

            defiLatitud: formData.DefiLatitud,
            defiLongitud: formData.DefiLongitud,
            defiFecRegistro: formData.DefiFecRegistro instanceof Date ? formData.DefiFecRegistro.toISOString() : now.toISOString(),
            defiFecModificacion: now.toISOString(),
            defiActivo: true
        };
        
        onSave(payload);
    };

    // --- RENDERIZADOR DE CAMPOS ---
    const renderDynamicField = (field) => {
        if (field.hidden) return null;

        const commonProps = {
            id: field.key,
            value: formData[field.key], 
            className: classNames('w-full', { 'p-invalid': submitted && field.required && !formData[field.key] }),
            placeholder: field.label,
            disabled: field.readonly
        };

        if (field.key === 'DefiEstado') {
            return (
                <div className="field mb-3 w-full" key={field.key}>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Estado</label>
                    <InputText value="NUEVA DEFICIENCIA" readOnly className="font-bold text-green-700 bg-green-50 text-center text-sm w-full" />
                </div>
            );
        }

        // Renderizado especial de Criticidad con opciones dinámicas
        if (field.key === 'DefiEstadoCriticidad') {
             return (
                <div className="field mb-3 w-full" key={field.key}>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Criticidad</label>
                    <Dropdown 
                        {...commonProps}
                        options={criticidadOptions} // 🔥 OPCIONES FILTRADAS
                        onChange={(e) => updateField(field.key, e.value)}
                        className="w-full"
                    />
                </div>
            );
        }

        return (
            <div className="field mb-3 w-full" key={field.key}> 
                <label htmlFor={field.key} className="font-bold text-sm block mb-1 text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'number' && (
                    <InputNumber 
                        {...commonProps} 
                        value={formData[field.key] != null ? Number(formData[field.key]) : null}
                        onValueChange={(e) => updateField(field.key, e.value)}
                        mode="decimal" minFractionDigits={2} maxFractionDigits={2} showButtons 
                        className="w-full"
                    />
                )}

                {field.type === 'textarea' && (
                    <InputTextarea 
                        {...commonProps}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        rows={5} 
                        autoResize 
                        className="w-full" 
                        style={{ minHeight: '120px' }} 
                    />
                )}

                {field.selectable && field.valueMap && (
                    <Dropdown 
                        {...commonProps}
                        value={formData[field.key]} 
                        options={Object.entries(field.valueMap).map(([k, v]) => ({ label: v, value: isNaN(k) ? k : Number(k) }))} 
                        onChange={(e) => updateField(field.key, e.value)}
                        className="w-full"
                    />
                )}

                {field.type === 'text' && !field.selectable && (
                    <div className="relative w-full">
                        <InputText 
                            {...commonProps} 
                            onChange={(e) => updateField(field.key, e.target.value)}
                            maxLength={field.key === 'DefiObservacion' ? 20 : undefined}
                            className="w-full"
                        />
                        {field.key === 'DefiObservacion' && (
                            <small className={`absolute right-0 -top-5 text-xs ${(formData[field.key]?.length || 0) === 20 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                {(formData[field.key]?.length || 0)}/20
                            </small>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog 
            visible={visible} 
            style={{ width: '950px', maxWidth: '95vw' }} 
            header={`Deficiencia ${deficiencyToEdit ? 'Editar' : 'Nueva'}`}
            modal className="p-fluid" onHide={onHide}
            footer={
                <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button label="Cancelar" icon="pi pi-times" onClick={onHide} severity="danger" />
                    <Button label="Guardar" icon="pi pi-check" onClick={handleSubmit} severity="success" />
                </div>
            }
        >
            <div className="flex flex-col gap-4 mt-2">
                {/* 1. CABECERA */}
                <div className="p-4 border rounded bg-blue-50 border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="field">
                            <label className="font-bold text-xs uppercase text-gray-500">Tipo Elemento</label>
                            <Dropdown 
                                value={formData.DefiTipoElemento} 
                                options={TIPO_ELEMENTO_OPTIONS} 
                                onChange={(e) => updateField('DefiTipoElemento', e.value)} 
                                disabled={!!deficiencyToEdit}
                            />
                        </div>
                        <div className="field">
                            <label className="font-bold text-xs uppercase text-gray-500">Código GIS</label>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon"><i className="pi pi-map-marker"></i></span>
                                <InputText 
                                    value={formData.DefiCodigoElemento} 
                                    onChange={(e) => updateField('DefiCodigoElemento', e.target.value)} 
                                    required className={classNames({ 'p-invalid': submitted && !formData.DefiCodigoElemento })}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="field">
                        <label className="font-bold text-blue-800 block mb-1">Tipificación (Defecto)</label>
                        <Dropdown 
                            value={formData.tipiInterno} 
                            options={typificationOptions} 
                            onChange={(e) => updateField('tipiInterno', e.value)} 
                            filter showClear placeholder={loadingTipos ? "Cargando..." : "Seleccione defecto..."}
                            itemTemplate={(op) => <div className="whitespace-normal py-1">{op.label}</div>}
                            className={classNames({ 'p-invalid': submitted && !formData.tipiInterno })}
                        />
                    </div>
                </div>

                {/* 2. CUERPO DINÁMICO DIVIDIDO */}
                <div className="flex flex-col md:flex-row gap-8">
                    {currentConfig ? (
                        <>
                            {/* IZQUIERDA: Datos Técnicos */}
                            <div className="flex-1 flex flex-col h-full">
                                <Divider align="left" className="mt-0"><span className="text-xs font-bold bg-gray-100 p-1 rounded text-gray-600">Datos Técnicos</span></Divider>
                                <div className="flex flex-col gap-1 w-full">
                                    {currentConfig.fields
                                        .filter(f => f.key !== 'DefiObservacion' && f.key !== 'DefiComentario')
                                        .map(renderDynamicField)}
                                </div>
                            </div>
                            
                            {/* ✅ LÍNEA VERTICAL CENTRAL (Visible en desktop) */}
                            <Divider layout="vertical" className="hidden md:flex" />

                            {/* DERECHA: Observaciones */}
                            <div className="flex-1 flex flex-col h-full">
                                <Divider align="left" className="mt-0"><span className="text-xs font-bold bg-gray-100 p-1 rounded text-gray-600">Detalle Inspección</span></Divider>
                                <div className="flex flex-col gap-1 w-full h-full">
                                     {currentConfig.fields
                                        .filter(f => f.key === 'DefiObservacion' || f.key === 'DefiComentario')
                                        .map(renderDynamicField)}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full text-center p-8 bg-gray-50 rounded border border-dashed text-gray-400">
                            <i className="pi pi-arrow-up text-2xl mb-2 block"></i>
                            Seleccione una tipificación para cargar el formulario.
                        </div>
                    )}
                </div>

                {/* 3. FOOTER METADATOS */}
                <div className="bg-gray-100 p-3 rounded mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-200">
                    <div className="field mb-0 text-center">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Fecha Registro</label>
                        <Calendar 
                            value={formData.DefiFecRegistro} 
                            onChange={(e) => updateField('DefiFecRegistro', e.value)} 
                            showTime 
                            className="p-inputtext-sm w-full" 
                            inputClassName="text-center" 
                        />
                    </div>
                    <div className="field mb-0 text-center">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Latitud</label>
                        <InputNumber 
                            value={formData.DefiLatitud} 
                            onValueChange={(e) => updateField('DefiLatitud', e.value)} 
                            mode="decimal" minFractionDigits={6} 
                            className="p-inputtext-sm w-full" 
                            inputClassName="text-center" 
                        />
                    </div>
                    <div className="field mb-0 text-center">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Longitud</label>
                        <InputNumber 
                            value={formData.DefiLongitud} 
                            onValueChange={(e) => updateField('DefiLongitud', e.value)} 
                            mode="decimal" minFractionDigits={6} 
                            className="p-inputtext-sm w-full" 
                            inputClassName="text-center" 
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
}