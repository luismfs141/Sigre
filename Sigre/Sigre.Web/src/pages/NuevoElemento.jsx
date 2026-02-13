import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch'; // Asegúrate de tener esto instalado
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';
import { useElement } from '../hooks/useElement'; // IMPORTAMOS EL HOOK PERSONALIZADO

export default function NuevoElemento({ onSave }) {

    // === 1. ESTADO INICIAL (Para poder resetear después) ===
    const initialFormState = {
        tipoElemento: 'POST', // 'POST' o 'VANO'
        etiqueta: '',
        codigo: '',
        
        
        // Campos de Poste
        latitud: null, 
        longitud: null,
        materialPoste: 1, // Default Concreto
        altura: 8,        // Default 8m
        idRetenida: 5,    // Default Sin Retenida

        // Campos de Vano
        latitudIni: null, longitudIni: null, 
        latitudFin: null, longitudFin: null,
        materialVano: 'ALU', // Default Aluminio
        nodoInicial: '', 
        nodoFinal: ''
    };

    // === 2. ESTADOS DEL COMPONENTE ===
    const [formData, setFormData] = useState(initialFormState);
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);

    // === 3. INFRAESTRUCTURA (Alimentadores y SEDs) ===
    const { feeders, loading: loadingFeeders } = useFeeder();
    
    // Extraer ID seguro para el hook de SEDs
    const feederIdForHook = (selectedFeeder && typeof selectedFeeder === 'object') ? selectedFeeder.value : selectedFeeder;
    
    const { seds: listaSeds, loading: loadingSeds } = useSedsByFeeder(feederIdForHook);

    // Mapeo para el Dropdown de SEDs (Código - Etiqueta)
    const sedsOptions = (listaSeds || []).map(sed => ({
        label: `${sed.sedCodigo} || ''}`,
        value: sed.sedInterno
    }));

    // === 4. HOOK DE CREACIÓN ===
    const { createElement, loading: saving } = useElement();

    // === 5. LISTAS ESTÁTICAS ===
    const MATERIAL_POSTE_OPTIONS = [
        { label: 'Madera', value: 1 }, { label: 'C.A.C.', value: 2 },
        { label: 'Metálico', value: 3 }, { label: 'Fibra de vidrio', value: 4 }
    ];

    const MATERIAL_VANO_OPTIONS = [
        { label: 'Aluminio (ALU)', value: 'ALU' }, 
        { label: 'Cobre (CU)', value: 'CU' },
        { label: 'Aleación', value: 'ALE' }
    ];

    const RETENIDA_OPTIONS = [
        { label: 'Retenida normal', value: 1 }, { label: 'Retenida contra punta', value: 2 },
        { label: 'Retenida vertical', value: 3 }, { label: 'Retenida aérea', value: 4 },
        { label: 'Sin retenida', value: 5 }
    ];

    // === 6. HANDLERS ===
    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // A. Intentamos guardar usando el Hook
            const idGenerado = await createElement(formData, selectedFeeder, selectedSed);
            
            // B. Si llega aquí, fue ÉXITO
            window.alert(`✅ ¡Guardado Correctamente!\nID Interno Generado: ${idGenerado}`);

            // C. LIMPIAR FORMULARIO (Reset total)
            setFormData(initialFormState);
            
            // Nota: No limpiamos selectedFeeder para facilitar la carga masiva en el mismo circuito.
            // Si quisieras limpiar todo, descomenta:
            // setSelectedFeeder(null); setSelectedSed(null);

            if (onSave) onSave(); // Callback opcional si el padre lo necesita

        } catch (error) {
            // D. Si falla, mostramos el error detallado (incluyendo SQL Errors)
            window.alert(`⚠️ NO SE PUDO GUARDAR:\n\n${error.message}`);
        }
    };

    return (
        <div className="h-full bg-white p-4 flex flex-col w-full shadow-1 overflow-y-auto">

            {/* CABECERA */}
            <div className="flex justify-between align-items-center mb-4 border-b pb-2 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-700 m-0">
                    NUEVO {formData.tipoElemento === 'POST' ? 'POSTE' : 'VANO'}
                </h2>
                <Button
                    label={saving ? "GUARDANDO..." : "GUARDAR"}
                    icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"}
                    onClick={handleSubmit}
                    disabled={saving}
                    className="p-button-success p-button-sm"
                />
            </div>

            <div className="grid p-fluid">

                {/* 1. TIPO DE ELEMENTO */}
                <div className="col-12 mb-2">
                    <div className="flex gap-4 p-2 bg-gray-50 border-round align-items-center justify-content-between">
                        <div className="flex gap-4">
                            <span className="font-bold text-sm">TIPO:</span>
                            <div className="flex align-items-center">
                                <input type="radio" id="rp" name="te" checked={formData.tipoElemento === 'POST'} onChange={() => handleChange('tipoElemento', 'POST')} />
                                <label htmlFor="rp" className="ml-1 cursor-pointer">Poste</label>
                            </div>
                            <div className="flex align-items-center">
                                <input type="radio" id="rv" name="te" checked={formData.tipoElemento === 'VANO'} onChange={() => handleChange('tipoElemento', 'VANO')} />
                                <label htmlFor="rv" className="ml-1 cursor-pointer">Vano</label>
                            </div>
                        </div>

                     
                    </div>
                </div>

                {/* 2. INFRAESTRUCTURA */}
                <div className="col-6">
                    <label className="text-xs font-bold text-gray-500 block mb-1">ALIMENTADOR *</label>
                    <Dropdown
                        value={selectedFeeder}
                        options={feeders || []}
                        onChange={(e) => {
                            setSelectedFeeder(e.value);
                            setSelectedSed(null); // Resetear SED al cambiar Alimentador
                        }}
                        optionLabel="label"
                        placeholder="Seleccione..."
                        filter
                        showClear
                        filterBy="label"
                        className="w-full"
                        disabled={loadingFeeders}
                    />
                </div>

                <div className="col-6">
                    <label className="text-xs font-bold text-gray-500 block mb-1">SUBESTACIÓN</label>
                    <Dropdown
                        value={selectedSed}
                        options={sedsOptions}
                        onChange={(e) => setSelectedSed(e.value)}
                        optionLabel="label"
                        placeholder={loadingSeds ? "Cargando..." : "Busque SED..."}
                        filter
                        filterBy="label"
                        showClear
                        disabled={!selectedFeeder || loadingSeds}
                        className="w-full"
                        emptyMessage={loadingSeds ? "Cargando..." : "Sin resultados"}
                    />
                </div>

                {/* 3. IDENTIFICACIÓN */}
                <div className="col-6">
                    <label className="text-xs font-bold text-gray-500 block mb-1">ETIQUETA (Use . si desconoce)*</label>
                    <InputText value={formData.etiqueta} onChange={(e) => handleChange('etiqueta', e.target.value)} placeholder="Ej: 164544" />
                </div>
                <div className="col-6">
                    <label className="text-xs font-bold text-gray-500 block mb-1">CÓDIGO (GIS/NODO)</label>
                    <InputText value={formData.codigo} onChange={(e) => handleChange('codigo', e.target.value)} placeholder="Ej: PTO000/VBT000" />
                </div>

                {/* 4. CAMPOS ESPECÍFICOS */}
                {formData.tipoElemento === 'POST' ? (
                    <>
                        <div className="col-12 mt-2"><div className="border-bottom-1 border-gray-200"></div></div>
                        <h4 className="col-12 text-sm text-blue-600 m-0 mt-2">GEOMETRÍA Y DATOS (POSTE)</h4>
                        
                        <div className="col-6">
                            <label className="text-xs font-bold text-gray-500 block mb-1">LATITUD</label>
                            <InputNumber value={formData.latitud} onValueChange={(e) => handleChange('latitud', e.value)} mode="decimal" minFractionDigits={7} maxFractionDigits={12} placeholder="-16.000000" />
                        </div>
                        <div className="col-6">
                            <label className="text-xs font-bold text-gray-500 block mb-1">LONGITUD</label>
                            <InputNumber value={formData.longitud} onValueChange={(e) => handleChange('longitud', e.value)} mode="decimal" minFractionDigits={7} maxFractionDigits={12} placeholder="-71.000000"  />
                        </div>

                        <div className="col-12 md:col-4">
                            <label className="text-xs font-bold text-gray-500 block mb-1">MATERIAL</label>
                            <Dropdown value={formData.materialPoste} options={MATERIAL_POSTE_OPTIONS} onChange={(e) => handleChange('materialPoste', e.value)} placeholder="Seleccione..." className="w-full" />
                        </div>
                        <div className="col-6 md:col-4">
                            <label className="text-xs font-bold text-gray-500 block mb-1">ALTURA (m)</label>
                            <InputNumber value={formData.altura} onValueChange={(e) => handleChange('altura', e.value)} mode="decimal" minFractionDigits={1} className="w-full"/>
                        </div>
                        <div className="col-6 md:col-4">
                            <label className="text-xs font-bold text-gray-500 block mb-1">RETENIDA</label>
                            <Dropdown value={formData.idRetenida} options={RETENIDA_OPTIONS} onChange={(e) => handleChange('idRetenida', e.value)} placeholder="Seleccione..." className="w-full" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-12 mt-2"><div className="border-bottom-1 border-gray-200"></div></div>
                        <h4 className="col-12 text-sm text-blue-600 m-0 mt-2">GEOMETRÍA (VANO)</h4>
                        
                        <div className="col-6">
                            <label className="text-xs font-bold text-gray-500 block mb-1">LAT. INICIAL</label>
                            <InputNumber value={formData.latitudIni} onValueChange={(e) => handleChange('latitudIni', e.value)} mode="decimal" minFractionDigits={7} maxFractionDigits={12} placeholder="-16.000000" />
                        </div>
                        <div className="col-6">
                            <label className="text-xs font-bold text-gray-500 block mb-1">LON. INICIAL</label>
                            <InputNumber value={formData.longitudIni} onValueChange={(e) => handleChange('longitudIni', e.value)} mode="decimal" minFractionDigits={7} maxFractionDigits={12} placeholder="-71.000000" />
                        </div>
                        <div className="col-6">
                            <label className="text-xs font-bold text-gray-500 block mb-1">LAT. FINAL</label>
                            <InputNumber value={formData.latitudFin} onValueChange={(e) => handleChange('latitudFin', e.value)} mode="decimal" minFractionDigits={7} maxFractionDigits={12} placeholder="-16.000000" />
                        </div>
                        <div className="col-6">
                            <label className="text-xs font-bold text-gray-500 block mb-1">LON. FINAL</label>
                            <InputNumber value={formData.longitudFin} onValueChange={(e) => handleChange('longitudFin', e.value)} mode="decimal" minFractionDigits={7} maxFractionDigits={12} placeholder="-71.000000" />
                        </div>

                        <h4 className="col-12 text-sm text-blue-600 m-0 mt-2">CONECTIVIDAD Y MATERIAL</h4>
                        {/* <div className="col-4">
                            <label className="text-xs font-bold text-gray-500 block mb-1">MATERIAL VANO</label>
                            <Dropdown value={formData.materialVano} options={MATERIAL_VANO_OPTIONS} onChange={(e) => handleChange('materialVano', e.value)} placeholder="Seleccione..." className="w-full" />
                        </div> */}
                        <div className="col-4">
                            <label className="text-xs font-bold text-gray-500 block mb-1">NODO INICIAL</label>
                            <InputText value={formData.nodoInicial} onChange={(e) => handleChange('nodoInicial', e.target.value)} placeholder="044031"/>
                        </div>
                        <div className="col-4">
                            <label className="text-xs font-bold text-gray-500 block mb-1">NODO FINAL</label>
                            <InputText value={formData.nodoFinal} onChange={(e) => handleChange('nodoFinal', e.target.value)} placeholder="044032"/>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}