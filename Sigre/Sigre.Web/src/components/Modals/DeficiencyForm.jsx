import React, { useState, useEffect, useMemo,useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';
import { Message } from 'primereact/message';
import { Calendar } from 'primereact/calendar';
import { AutoComplete } from 'primereact/autocomplete';

import { useTypification } from '../../hooks/useTypification';
import { useElements } from '../../hooks/useElement'; 
import { usePosteVanoSearch } from '../../hooks/usePosteVanoSearch';
import { DEFICIENCY_FIELD_MAP, ALL_DEFICIENCY_OPTIONS } from '../../utils/deficiencyConfig';

const TIPO_ELEMENTO_OPTIONS = [
    { label: 'POSTE', value: 'POST' },
    { label: 'VANO', value: 'VANO' },
];

const ALL_CRITICIDAD_OPTIONS = [
    { label: 'LEVE', value: 1 },
    { label: 'MEDIO', value: 2 },
    { label: 'CRÍTICO', value: 3 }
];

export default function DeficiencyForm({
    visible,
    onHide,
    onSave,
    deficiencyToEdit,
    alimentadorId,
    sedId,
    existingDeficiencies = [],
    referenceSelection
}) {
    const [formData, setFormData] = useState({});
    const [submitted, setSubmitted] = useState(false);
    // NUEVO: Estado para errores de validación en tiempo real
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const { getCodeById, masterTypifications, loading: loadingTipos } = useTypification();
    const { fetchPostesChunk, fetchVanosChunk } = useElements();
    const { suggestions, searchNode } = usePosteVanoSearch(fetchPostesChunk, fetchVanosChunk);

    

// =========================================================================
    // 1. REGLAS DE NEGOCIO: VALIDACIÓN DE HISTORIAL (S/D vs FALLAS)
    // =========================================================================
    
    // A. ¿Ya existe un registro "SIN DEFICIENCIA" (ID 0)?
    // Si esto es true, NO se pueden agregar deficiencias reales.
    const hasCleanRecord = useMemo(() => {
        if (!formData.defiCodigoElemento) return false;
        const currentCode = formData.defiCodigoElemento.trim().toUpperCase();

        return existingDeficiencies.some(d =>
            d.defiActivo &&
            d.defiCodigoElemento?.trim().toUpperCase() === currentCode &&
            Number(d.tipiInterno) === 0 &&
        // 🔥 CLAVE: Ignorar el registro que estamos editando actualmente
        (!deficiencyToEdit || d.defiInterno !== deficiencyToEdit.defiInterno)
        );
    }, [formData.defiCodigoElemento, existingDeficiencies, deficiencyToEdit]);

    // B. ¿Ya existen "DEFICIENCIAS REALES" (ID > 0)?
    // Si esto es true, NO se puede crear un registro "Sin Deficiencia".
    const hasRealDeficiencies = useMemo(() => {
        if (!formData.defiCodigoElemento) return false;
        const currentCode = formData.defiCodigoElemento.trim().toUpperCase();

        return existingDeficiencies.some(d =>
            d.defiActivo &&
            d.defiCodigoElemento?.trim().toUpperCase() === currentCode &&
            Number(d.tipiInterno) > 0 &&
        // 🔥 CLAVE: Ignorar el registro que estamos editando actualmente
        (!deficiencyToEdit || d.defiInterno !== deficiencyToEdit.defiInterno)
    );
}, [formData.defiCodigoElemento, existingDeficiencies, deficiencyToEdit]);

    // Helper para saber si estamos editando el registro S/D actual
    const isEditingSD = deficiencyToEdit && Number(formData.tipiInterno) === 0;
    // =========================================================================
    // 2. CONFIGURACIÓN DINÁMICA (Campos según Código)
    // =========================================================================
const currentConfig = useMemo(() => {
        // Corrección: Validamos null/undefined explícitamente, permitiendo el 0
        if (formData.tipiInterno === null || formData.tipiInterno === undefined) return null;
        
        // Si es 0, retornamos directo la config de SIN DEFICIENCIA
        if (Number(formData.tipiInterno) === 0) return DEFICIENCY_FIELD_MAP["0"];

        const code = getCodeById(formData.tipiInterno);
        return DEFICIENCY_FIELD_MAP[code] || null;
    }, [formData.tipiInterno, getCodeById]);
    
    // Helper para saber si estamos en modo "Sin Deficiencia"
    const isSinDeficiencia = Number(formData.tipiInterno) === 0;

    // =========================================================================
    // 3. OPCIONES DEL DROPDOWN (Filtradas por Tipo + Regla de Duplicados + Mapeo ID)
    // =========================================================================
    const typificationOptions = useMemo(() => {
        // Si no hay datos maestros, no mostramos nada
        if (!masterTypifications || masterTypifications.length === 0) return [];

        // --- PASO A: IDENTIFICAR QUÉ CÓDIGOS YA ESTÁN USADOS ---
        const currentGis = formData.defiCodigoElemento?.trim().toUpperCase();

        const usedCodes = existingDeficiencies
            .filter(d => {
                // 1. Que pertenezca al mismo elemento (código GIS)
                const sameGis = d.defiCodigoElemento?.trim().toUpperCase() === currentGis;
                // 2. Que esté activo (no borrado lógico)
                const isActive = d.defiActivo;
                // 3. Que NO sea el registro que estamos editando ahora mismo
                const notSelf = !deficiencyToEdit || d.defiInterno !== deficiencyToEdit.defiInterno;

                return sameGis && isActive && notSelf;
            })
            .map(d => getCodeById(d.tipiInterno)); // Convertimos ID a Código para comparar fácil

        // --- PASO B: FILTRAR LA LISTA ESTÁTICA ---
        const validOptions = ALL_DEFICIENCY_OPTIONS.filter(opt => {
            // 1. Filtro Básico: ¿Es POSTE o VANO?
            if (opt.code === "0") return true;
            if (opt.type !== 'BOTH' && opt.type !== formData.defiTipoElemento) return false;

            // 2. REGLA DE ORO: Evitar duplicados (Excepto la 7004)
            if (usedCodes.includes(opt.code) && opt.code !== '7004') {
                return false;
            }

            return true;
        });

        // --- PASO C: CRUZAR CON BASE DE DATOS (Obtener IDs reales) ---
        return validOptions.map(staticOpt => {
            if (staticOpt.code === "0") {
                return { label: staticOpt.name, value: 0 };
            }
            const matchInDb = masterTypifications.find(t =>
                String(t.code || t.tipiCodigo) === String(staticOpt.code)
            );

            if (!matchInDb) return null;

            return {
                label: staticOpt.name,
                value: Number(matchInDb.tipiInterno || matchInDb.typificationId)
            };
        }).filter(opt => opt !== null);

    }, [
        formData.defiTipoElemento,
        formData.defiCodigoElemento,
        masterTypifications,
        existingDeficiencies,
        deficiencyToEdit,
        getCodeById
    ]);

    const criticidadOptions = useMemo(() => {
        if (deficiencyToEdit) return ALL_CRITICIDAD_OPTIONS;
        return ALL_CRITICIDAD_OPTIONS.filter(opt => opt.value !== 2);
    }, [deficiencyToEdit]);
    

    // =========================================================================
    // 4. INICIALIZACIÓN (CARGA DE DATOS)
    // =========================================================================
    useEffect(() => {
        if (visible) {
            // Reseteamos errores al abrir
            setFieldErrors({});
            setIsSaving(false);

            if (deficiencyToEdit) {
                // --- MODO EDICIÓN ---
                const getValue = (keyBase) => deficiencyToEdit[`defi${keyBase}`] ?? deficiencyToEdit[`Defi${keyBase}`] ?? deficiencyToEdit[keyBase] ?? null;
                const _fechaRaw = getValue('FecRegistro');
                const _fecha = _fechaRaw ? new Date(_fechaRaw) : new Date();

                setFormData({
                    defiInterno: Number(getValue('Interno')),

                    // 🔥 FORZADO: Estado a 'N' al editar para que aparezca "Nueva"
                    defiEstado: 'N',

                    defiCodigoElemento: getValue('CodigoElemento') || '',
                    defiTipoElemento: getValue('TipoElemento') || 'POST',
                    tipiInterno: Number(deficiencyToEdit.tipiInterno ?? deficiencyToEdit.TipiInterno),
                    defiLatitud: Number(getValue('Latitud')) || 0,
                    defiLongitud: Number(getValue('Longitud')) || 0,
                    defiFecRegistro: _fecha,
                    defiObservacion: getValue('Observacion') || '',
                    defiComentario: getValue('Comentario') || '',
                    defiEstadoCriticidad: Number(getValue('EstadoCriticidad')),
                    defiNumSuministro: getValue('NumSuministro') || '',
                    defiDistHorizontal: getValue('DistHorizontal'),
                    defiDistVertical: getValue('DistVertical'),
                    defiAccesibilidad: getValue('Accesibilidad'),
                    defiTipoCruce: getValue('TipoCruce'),
                    defiInspeccionado: Number(getValue('Inspeccionado')) || 0,
                    defiUsuarioInic: getValue('UsuarioInic'),
                    defiCol2: getValue('Col2') || '' 
                });
            } else {
                // --- MODO NUEVO ---
const getRefValue = (keyBase) => referenceSelection ? (referenceSelection[`defi${keyBase}`] ?? referenceSelection[`Defi${keyBase}`] ?? referenceSelection[keyBase]) : null;
                
                // 🔥 AQUÍ ESTÁ EL CAMBIO: 
                // Jalamos el Código GIS del elemento seleccionado. Si no hay selección, ponemos '0'
                const initialCode = getRefValue('CodigoElemento') || referenceSelection?.codigo ;
                const initialType = getRefValue('TipoElemento') || 'POST';
                const latRaw = getRefValue('Latitud') || 0;
                const lngRaw = getRefValue('Longitud') || 0;
                let initialDate = new Date();
                const dateRef = getRefValue('FecRegistro');
                if (dateRef) initialDate = new Date(dateRef);
                const initialCol2= getRefValue('Col2') || '';

                setFormData({
                    defiCodigoElemento: initialCode,
                    defiTipoElemento: initialType,
                    defiEstado: 'N',
                    sedCodigo: sedId,
                    defiFecRegistro: initialDate,
                    defiLatitud: Number(latRaw),
                    defiLongitud: Number(lngRaw),
                    defiObservacion: '',
                    defiComentario: '',
                    defiEstadoCriticidad: 0,
                    defiCol2: initialCol2
                });

                if (Number(latRaw) === 0 && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (p) => setFormData(prev => ({ ...prev, defiLatitud: p.coords.latitude, defiLongitud: p.coords.longitude })),
                        (e) => console.warn("GPS Error", e),
                        { enableHighAccuracy: true }
                    );
                }
            }
            setSubmitted(false);
        }
    }, [visible, deficiencyToEdit, sedId, referenceSelection]);

    // --- BÚSQUEDA HÍBRIDA (POSTES Y VANOS) ---
    // Crea la referencia fuera de la función pero dentro de tu componente
const debounceTimer = useRef(null);


    const itemTemplate = (item) => {
        const esPoste = item._tipo === 'POSTE';
        
        return (
            <div className="flex flex-col border-b border-gray-100 p-2 hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* ICONO */}
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full ${esPoste ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            <i className={`pi ${esPoste ? 'pi-bolt' : 'pi-arrows-h'} text-sm`}></i>
                        </div>
                        
                        {/* DATOS: PRIORIDAD AL CÓDIGO */}
                        <div className="flex flex-col">
                            {/* CÓDIGO EN GRANDE */}
                            <span className="font-extrabold text-sm text-gray-800">
                                {item.codigo}
                            </span>
                            {/* Etiqueta / Tipo en pequeño */}
                            <span className="text-[10px] text-gray-500 font-medium">
                                {esPoste ? `POSTE: ${item.label}` : `VANO: ${item.label}`}
                            </span>
                        </div>
                    </div>

                    {/* Badge lateral */}
                    <span className={`text-[9px] px-1.5 rounded border ${esPoste ? 'border-blue-200 text-blue-600' : 'border-green-200 text-green-600'}`}>
                        {item._tipo}
                    </span>
                </div>
            </div>
        );
    };

    // =========================================================================
    // 5. MANEJO DE CAMBIOS Y VALIDACIÓN INDIVIDUAL
    // =========================================================================

    // Función auxiliar para validar un campo específico
    const validateField = (fieldKey, value) => {
        if (!currentConfig) return null;
        const field = currentConfig.fields.find(f => f.key === fieldKey);
        if (!field || !field.validation) return null;

        // Validación de máximo
        if (field.type === 'number' && field.validation.max !== undefined && Number(value) > field.validation.max) {
            return field.validation.message || `${field.label} excede el máximo permitido.`;
        }
        // Validación personalizada
        if (field.validation.custom) {
            const tempFormData = { ...formData, [fieldKey]: value };
            return field.validation.custom(value, tempFormData);
        }
        return null;
    };

    const updateField = (key, value) => {
        setFormData(prev => {
            const newData = { ...prev, [key]: value };
            if (key === 'defiTipoElemento') newData.tipiInterno = null;
            if (key === 'tipiInterno' && Number(value) === 0) {
            newData.defiEstadoCriticidad = 0;
            newData.defiNumSuministro = '';
            newData.defiObservacion = '';
        }
            return newData;
        });

        // Validamos en tiempo real y guardamos el error si existe
        const error = validateField(key, value);
        setFieldErrors(prev => ({ ...prev, [key]: error }));
    };

    // Validación Total antes de guardar
    const validateDynamicForm = () => {
        if (!currentConfig) return true;
        const errors = [];

        currentConfig.fields.forEach(field => {
            if (field.readonly || field.hidden) return;
            const value = formData[field.key];

            // Requeridos
            if (field.required && (value === null || value === undefined || value === '')) {
                errors.push(`El campo "${field.label}" es obligatorio.`);
                return;
            }

            // Validaciones específicas
            const fieldError = validateField(field.key, value);
            if (fieldError) {
                errors.push(fieldError);
            }
        });

        if (errors.length > 0) {
            alert("Por favor corrija:\n\n" + errors.map(e => "• " + e).join("\n"));
            return false;
        }
        return true;
    };

    // =========================================================================
    // 6. GUARDADO
    // =========================================================================
const handleSubmit = async () => {
        setSubmitted(true);

// 1. Validaciones Básicas
        if (!formData.defiCodigoElemento?.trim()) { alert("Falta Código GIS."); return; }
        if (formData.tipiInterno === null || formData.tipiInterno === undefined) {
            alert("Falta Tipificación.");
            return;
        }

        // 🔥 AQUÍ ENTRA LA VALIDACIÓN DINÁMICA 🔥
        // Validamos todos los campos obligatorios del JSON de configuración
        // Si validateDynamicForm devuelve false, significa que hubo errores y ya mostró el alert.
        if (!validateDynamicForm()) {
            setSubmitted(false); // Reiniciamos el estado para que puedan intentar de nuevo
            return;              // Detenemos el guardado
        }

        // 2. REGLAS DE NEGOCIO (Exclusión Mutua)
        // ¿El usuario está intentando guardar un registro "Sin Deficiencia" (ID 0)?
       // 2. REGLAS DE NEGOCIO (Exclusión Mutua)
        const isSavingSD = Number(formData.tipiInterno) === 0;

// 🔥 NUEVA REGLA: Bloquear DUPLICADOS de S/D
        if (isSavingSD && hasCleanRecord) { // <-- Quitamos el && !isEditingSD
    alert("ACCIÓN BLOQUEADA:\nYa existe un registro 'SIN DEFICIENCIA' para este elemento.\n\nNo puede tener dos registros S/D al mismo tiempo.");
    setSubmitted(false); 
    return;
}

        // CASO A: Intenta crear 'SIN DEFICIENCIA', pero ya existen fallas reales
        if (isSavingSD && hasRealDeficiencies) {
            alert("ACCIÓN BLOQUEADA:\nNo puede registrar 'SIN DEFICIENCIA' porque el elemento ya tiene fallas reportadas.\n\n>> Elimine las fallas existentes primero.");
            setSubmitted(false);
            return;
        }

        // CASO B: Intenta crear una FALLA REAL, pero ya existe un registro 'SIN DEFICIENCIA'
        if (!isSavingSD && hasCleanRecord ) {
            alert("ACCIÓN BLOQUEADA:\nEl elemento está marcado como 'SIN DEFICIENCIA'.\n\n>> Elimine el registro S/D primero para agregar fallas.");
            setSubmitted(false);
            return;
        }

        const now = new Date();
        const registroDate = formData.defiFecRegistro instanceof Date ? formData.defiFecRegistro : now;
        const isPoste = formData.defiTipoElemento === 'POST' || formData.defiTipoElemento === 'POSTE';
        const toLocalISOString = (date) => {
            const tzOffset = date.getTimezoneOffset() * 60000; // offset en milisegundos
            const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, -1);
            return localISOTime; // Retorna formato "YYYY-MM-DDTHH:mm:ss.sss" (Hora Local)
        };

        const cleanPayload = {
            defiInterno: deficiencyToEdit ? deficiencyToEdit.defiInterno : 0,
            // Si sedId es un objeto, extraemos el sedInterno, sino usamos el valor directo
            sedCodigo: typeof sedId === 'object' ? sedId.sedInterno : sedId,
            defiUsuarioInic: formData.defiUsuarioInic,
            defiCodigoElemento: formData.defiCodigoElemento.trim(),
            defiTipoElemento: formData.defiTipoElemento,
            tipiInterno: Number(formData.tipiInterno),
            defiLatitud: Number(formData.defiLatitud) || 0,
            defiLongitud: Number(formData.defiLongitud) || 0,
            defiFecRegistro: toLocalISOString(registroDate),
            defiDistHorizontal: isPoste ? null : (Number(formData.defiDistHorizontal) || 0),
            defiDistVertical: isPoste ? null : (Number(formData.defiDistVertical) || 0),
            defiAccesibilidad: isPoste ? null : (formData.defiAccesibilidad ? String(formData.defiAccesibilidad) : null),
            defiTipoCruce: isPoste ? null : (formData.defiTipoCruce ? String(formData.defiTipoCruce) : null),
            defiNumSuministro: formData.defiNumSuministro ? String(formData.defiNumSuministro).trim() : null,
            defiObservacion: formData.defiObservacion ? String(formData.defiObservacion).trim() : '',
            defiComentario: formData.defiComentario ? String(formData.defiComentario).trim() : '',
            defiEstadoCriticidad: Number(formData.defiEstadoCriticidad),
            defiActivo: true,
            defiCol2: formData.defiCol2 ? String(formData.defiCol2).trim() : ''
        };

        setIsSaving(true); 
    
    try {
        // Ejecuta el guardado. Usamos Promise.resolve por si tu onSave devuelve una promesa.
        await Promise.resolve(onSave(cleanPayload)); 
    } catch (error) {
        console.error("Error al guardar:", error);
    } finally {
        // Cooldown de seguridad: Reactivamos el botón después de 1.5s 
        // en caso de que el modal no se cierre automáticamente tras un error.
        setTimeout(() => {
            setIsSaving(false);
        }, 1500);
    }
    };

    // =========================================================================
    // 7. RENDERIZADO DE CAMPOS (Con HelperText y Validaciones Visuales)
    // =========================================================================
    const renderDynamicField = (field) => {
        if (field.hidden) return null;
        const fieldKey = field.key;

        // Verificamos si hay error en este campo
        const hasError = !!fieldErrors[fieldKey];

        const commonProps = {
            id: fieldKey, value: formData[fieldKey],
            // Clase condicional: Error de validación O Submit vacío requerido
            className: classNames('w-full', { 'p-invalid': hasError || (submitted && field.required && !formData[fieldKey]) }),
            placeholder: field.label, disabled: field.readonly
        };

        // --- Lógica del Texto de Ayuda ---
        let dynamicHelper = field.helperText;
        // Caso especial 7006: Mostrar límite según cruce
        if (fieldKey === 'defiDistVertical' && formData.tipiInterno && getCodeById(formData.tipiInterno) === '7006' && formData.defiTipoCruce) {
            const limites = { 1: 5.5, 2: 6.5, 3: 7.5, 4: 4.0, 5: 5.5 };
            const limiteExacto = limites[Number(formData.defiTipoCruce)];
            if (limiteExacto) {
                dynamicHelper = `(Límite: < ${limiteExacto}m)`;
            }
        }

if (fieldKey === 'defiEstadoCriticidad') {
            // 1. Verificamos si estamos en el caso "Sin Deficiencia"
            const isSinDef = formData.tipiInterno === 0;

            // 2. Si es SINDEF, forzamos visualmente el valor a 0, sino usamos el valor normal
            const currentValue = isSinDef ? 0 : commonProps.value;

            return (
                <div className="field mb-3 w-full" key={fieldKey}>
                    <label className="text-sm font-bold text-gray-700 block mb-1">
                        Criticidad
                    </label>
                    <Dropdown 
                        {...commonProps} 
                        value={currentValue}
                        options={criticidadOptions} 
                        optionLabel="label" 
                        optionValue="value" 
                        disabled={isSinDef} // 3. Bloqueamos el input si es SINDEF
                        onChange={(e) => {
                            // Prevenimos actualizaciones innecesarias si está bloqueado
                            if (!isSinDef) updateField(fieldKey, e.value);
                        }} 
                    />
                </div>
            );
        }

        return (
            <div className="field mb-3 w-full" key={fieldKey}>
                <label htmlFor={fieldKey} className="font-bold text-sm block mb-1 text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}

                    {/* Renderizamos el Texto de Ayuda Naranja */}
                    {dynamicHelper && (
                        <span className="ml-2 text-xs text-orange-600 font-normal">
                            {dynamicHelper}
                        </span>
                    )}
                </label>

                {field.type === 'number' && <InputNumber {...commonProps} value={formData[fieldKey] != null ? Number(formData[fieldKey]) : null} onValueChange={(e) => updateField(fieldKey, e.value)} mode="decimal" minFractionDigits={2} maxFractionDigits={2} showButtons />}
                {field.type === 'textarea' && <InputTextarea {...commonProps} onChange={(e) => updateField(fieldKey, e.target.value)} rows={5} autoResize style={{ minHeight: '100px' }} />}
                {field.selectable && field.valueMap && fieldKey !== 'defiEstadoCriticidad' && <Dropdown {...commonProps} options={Object.entries(field.valueMap).map(([k, v]) => ({ label: v, value: isNaN(k) ? k : Number(k) }))} onChange={(e) => updateField(fieldKey, e.value)} />}
                {field.type === 'text' && !field.selectable && (<InputText {...commonProps} onChange={(e) => updateField(fieldKey, e.target.value)} maxLength={fieldKey === 'defiObservacion' ? 20 : undefined} />)}

                {/* Mensaje de error debajo del input (Opcional, pero recomendado) */}
                {hasError && <small className="p-error block">{fieldErrors[fieldKey]}</small>}
            </div>
        );
    };

    return (
        <Dialog visible={visible} style={{ width: '950px', maxWidth: '95vw' }} header={`Deficiencia ${deficiencyToEdit ? 'Editar' : 'Nueva'}`} modal className="p-fluid" onHide={onHide} footer={<div className="flex justify-end gap-2 pt-3 border-t">
            <Button 
                label="Cancelar" 
                icon="pi pi-times" 
                onClick={onHide} 
                severity="danger" 
                disabled={isSaving} // BLOQUEADO MIENTRAS GUARDA
            />
            <Button 
                label={isSaving ? "Guardando..." : "Guardar"} // TEXTO DINÁMICO
                icon={isSaving ? "pi pi-spin pi-spinner" : "pi pi-check"} // ÍCONO DE CARGA
                onClick={handleSubmit} 
                severity="success" 
                disabled={isSaving || (hasCleanRecord && !isEditingSD)} // BLOQUEADO MIENTRAS GUARDA
            />
        </div>}>
            <div className="flex flex-col gap-4 mt-2">
                <div className="p-4 border rounded bg-blue-50 border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
<div className="field">
    <label className="font-bold text-xs uppercase text-gray-500">Tipo Elemento(AUTOGENERADO)</label>
    <Dropdown 
        value={formData.defiTipoElemento} 
        options={TIPO_ELEMENTO_OPTIONS} 
        // Ya no necesitamos el onChange manual, el sistema lo controla
        disabled={true} // 🔥 BLOQUEO TOTAL
        className="bg-gray-100 opacity-90 cursor-not-allowed" 
    />
</div>
                        <div className="field">
    <label className="font-bold text-xs uppercase text-gray-500">Código GIS</label>
    
    {/* CONDICIONAL: Si es NUEVO (!deficiencyToEdit) mostramos el Buscador */}
    {!deficiencyToEdit ? (
<AutoComplete 
    value={formData.defiCodigoElemento} 
    suggestions={suggestions} 
    completeMethod={(e) => searchNode(e.query, alimentadorId, sedId)}
    field="codigo"
    itemTemplate={itemTemplate} 
    
    // 1. ESTO ES LO QUE FALTABA: Permitir escribir
    onChange={(e) => {
        const valor = e.value && e.value.codigo ? e.value.codigo : e.value;
        const texto = String(valor || '').toUpperCase(); // Forzamos a mayúsculas
        
        setFormData(prev => {
            let nuevoTipo = prev.defiTipoElemento;
            
            // Si el código contiene VBT o VANO, es un VANO
            if (texto.includes('VBT') || texto.includes('VANO')) {
                nuevoTipo = 'VANO';
            } 
            // Si el código contiene PTO o POST, es un POSTE
            else if (texto.includes('PTO') || texto.includes('POST')) {
                nuevoTipo = 'POST';
            }

            return { 
                ...prev, 
                defiCodigoElemento: texto, 
                defiTipoElemento: nuevoTipo // Se actualiza solo
            };
        });
    }}

    // 2. AL SELECCIONAR: Autocompletar Tipo y Coordenadas (Tu lógica actual)
    onSelect={(e) => {
        const item = e.value;
        const tipoParaDropdown = item._tipo === 'POSTE' ? 'POST' : 'VANO';
        setFormData(prev => ({
            ...prev,
            defiCodigoElemento: item.codigo,
            defiTipoElemento: tipoParaDropdown,
            defiLatitud: item.lat,        
            defiLongitud: item.lng
        }));
    }}
    
    placeholder="Buscar Poste o Vano..."
    className="w-full"
    inputClassName="w-full p-inputtext-sm font-bold uppercase"
/>
    ) : (
        // CONDICIONAL: Si es EDICIÓN, mostramos el Input bloqueado (tu código original)
        <InputText 
            value={formData.defiCodigoElemento} 
            disabled={!!deficiencyToEdit}
            className="w-full p-inputtext-sm bg-gray-100 font-bold text-gray-700"
        />
    )}
</div>
                    </div>

                    {hasCleanRecord && (
                        <Message
                            severity="warn"
                            text="Este elemento está registrado como 'SIN DEFICIENCIA'. Para agregar fallas, primero debe eliminar el registro S/D existente."
                            className="w-full mb-3 shadow-sm"
                            style={{ borderLeft: '5px solid #f59e0b' }}
                        />
                    )}

                    <div className="field">
                        <label className="font-bold text-blue-800 block mb-1">Tipificación (Defecto)</label>
                        <Dropdown
                            value={formData.tipiInterno}
                            options={typificationOptions}
                            onChange={(e) => updateField('tipiInterno', e.value)}
                            filter
                            showClear
                            placeholder={hasCleanRecord ? "BLOQUEADO (ELEMENTO S/D)" : "Seleccione defecto..."}
                            disabled={!formData.defiCodigoElemento || hasCleanRecord}
                            itemTemplate={(op) => <div className="whitespace-normal py-1 text-sm">{op.label}</div>}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 min-h-[300px]">
                    {currentConfig ? (
                        <>{/* COLUMNA IZQUIERDA: DATOS TÉCNICOS 
                                (Se oculta si es Sin Deficiencia) */}
                            {!isSinDeficiencia && (
                        
                            <div className="flex-1 flex flex-col h-full">
                                <Divider align="left" className="mt-0"><span className="text-xs font-bold bg-gray-100 p-1 rounded text-gray-600">Datos Técnicos</span></Divider>
                                <div className="flex flex-col gap-1 w-full">
                                    {currentConfig.fields.filter(f => f.key !== 'defiObservacion' && f.key !== 'defiComentario').map(renderDynamicField)}
                                </div>
                            </div>
                            )}
                            <Divider layout="vertical" className="hidden md:flex" />
                            <div className="flex-1 flex flex-col h-full">
                                <Divider align="left" className="mt-0"><span className="text-xs font-bold bg-gray-100 p-1 rounded text-gray-600">Detalle Inspección</span></Divider>
                                <div className="flex flex-col gap-1 w-full h-full">
                                    {currentConfig.fields.filter(f => f.key === 'defiObservacion' || f.key === 'defiComentario').map(renderDynamicField)}
                                </div>
                            </div>
                            
                        </>
                        
                        
                    ) : (
                        <div className="w-full flex items-center justify-center bg-gray-50 rounded border border-dashed text-gray-400">
                            <div className="text-center">
                                <i className="pi pi-info-circle text-2xl mb-2 block"></i>
                                {hasCleanRecord && !isEditingSD
                                    ? "Acción no permitida (Ya existe registro S/D)."
                                    : (isEditingSD ? "Edición restringida: Solo Ubicación y Fecha." : "Seleccione una tipificación.")}
                            </div>
                        </div>
                    )}

                </div>
                {/* SECCIÓN DE RESPONSABILIDAD (Estilo Compacto) */}
<div className="bg-gray-100 p-3 rounded mt-2 border border-gray-200">
    <div className="field mb-0 text-center">
        <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">
            Responsabilidad
        </label>
        <Dropdown 
            value={formData.defiCol2} 
            options={[
                { label: 'SEAL', value: 'SEAL' },
                { label: 'TERCEROS', value: 'TERCEROS' }
            ]} 
            onChange={(e) => updateField('defiCol2', e.value)} 
            placeholder="Seleccione Responsable"
            className="w-full p-inputtext-sm text-center border border-gray-400 shadow-sm"
            style={{ height: '34px' }}
        />
    </div>
</div>

                <div className="bg-gray-100 p-3 rounded mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-200">
                    <div className="field mb-0 text-center"><label className="text-[10px] font-bold text-gray-500 block mb-1">LATITUD</label><InputNumber value={formData.defiLatitud} onValueChange={(e) => updateField('defiLatitud', e.value)} mode="decimal" minFractionDigits={8} maxFractionDigits={12} className="w-full p-inputtext-sm text-center" inputClassName="text-center" /></div>
                    <div className="field mb-0 text-center"><label className="text-[10px] font-bold text-gray-500 block mb-1">LONGITUD</label><InputNumber value={formData.defiLongitud} onValueChange={(e) => updateField('defiLongitud', e.value)} mode="decimal" minFractionDigits={8} maxFractionDigits={12} className="w-full p-inputtext-sm text-center" inputClassName="text-center" /></div>
                    <div className="field mb-0 text-center"><label className="text-[10px] font-bold text-gray-500 block mb-1">FECHA REGISTRO</label><Calendar value={formData.defiFecRegistro} onChange={(e) => updateField('defiFecRegistro', e.value)} showTime hourFormat="24" className="w-full p-inputtext-sm" inputClassName="text-center" /></div>
                    
                </div>
            </div>
        </Dialog>
    );
}