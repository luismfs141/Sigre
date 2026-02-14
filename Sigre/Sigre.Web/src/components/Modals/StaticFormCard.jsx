import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { AutoComplete } from 'primereact/autocomplete';

import { useFeeder, useSedsByFeeder } from '../../hooks/useFeeder';
import { useElements } from '../../hooks/useElement';

export default function StaticFormCard({ elementToEdit, typeMode, onClear, onSave }) {
    // --- ESTADO INICIAL ---
    const initialState = {
        id: 0, tipoElemento: typeMode, etiqueta: '', codigo: '',
        alimentadorId: null, sedId: null, 
        latitud: null, longitud: null, materialPoste: 2, altura: 8, idRetenida: null,
        nodoInicial: '', nodoFinal: '',
        latitudIni: null, longitudIni: null, latitudFin: null, longitudFin: null
    };

    const [formData, setFormData] = useState(initialState);
    const [suggestions, setSuggestions] = useState([]);

    // Hooks
    const { feeders } = useFeeder();
    const { seds } = useSedsByFeeder(formData.alimentadorId);
    const { fetchPostesChunk } = useElements();

    // --- EFECTO: CARGAR DATOS AL EDITAR (MAPEO EXACTO) ---
    useEffect(() => {
        if (elementToEdit) {
            // Analizamos si es un POSTE (tiene postInterno) o VANO (tiene vanoInterno)
            // Usamos los nombres EXACTOS de tu JSON
            
            if (typeMode === 'POSTE') {
                setFormData({
                    id: elementToEdit.postInterno,
                    tipoElemento: 'POSTE',
                    // Mapeo campos POSTE (con null check usando || '')
                    codigo: elementToEdit.postCodigoNodo || '', 
                    etiqueta: elementToEdit.postEtiqueta || '',
                    alimentadorId: elementToEdit.alimInterno,
                    sedId: elementToEdit.postSubestacion,
                    
                    latitud: elementToEdit.postLatitud,
                    longitud: elementToEdit.postLongitud,
                    altura: elementToEdit.postAltura,
                    materialPoste: elementToEdit.postMaterial,
                    idRetenida: elementToEdit.postRetenidaTipo,

                    // Limpiamos campos de vano
                    nodoInicial: '', nodoFinal: '', 
                    latitudIni: null, longitudIni: null, latitudFin: null, longitudFin: null
                });
            } else {
                setFormData({
                    id: elementToEdit.vanoInterno,
                    tipoElemento: 'VANO',
                    // Mapeo campos VANO
                    codigo: elementToEdit.vanoCodigo || '',
                    etiqueta: elementToEdit.vanoEtiqueta || '',
                    alimentadorId: elementToEdit.alimInterno,
                    sedId: elementToEdit.vanoSubestacion,

                    nodoInicial: elementToEdit.vanoNodoInicial || '',
                    nodoFinal: elementToEdit.vanoNodoFinal || '',
                    latitudIni: elementToEdit.vanoLatitudIni,
                    longitudIni: elementToEdit.vanoLongitudIni,
                    latitudFin: elementToEdit.vanoLatitudFin,
                    longitudFin: elementToEdit.vanoLongitudFin,

                    // Limpiamos campos de poste
                    latitud: null, longitud: null, altura: 8, materialPoste: 2
                });
            }
        } else {
            setFormData(initialState);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elementToEdit, typeMode]);

    // --- HANDLERS ---
    const handleInternalClear = () => {
        setFormData(initialState);
    };

    const handleSave = () => {
        // Validación básica
        if (!formData.codigo && typeMode === 'POSTE') {
           // A veces el código es null en BD, pero al guardar quizás lo requieras
           // o quizás permitas guardar sin código. Ajusta según tu regla de negocio.
        }
        onSave(formData);
    };

    // AutoCompletado
    const searchPoste = async (event) => {
        const result = await fetchPostesChunk(0, 15, event.query);
        setSuggestions(result.data);
    };

    const onSelectPosteIni = (e) => {
        const p = e.value;
        setFormData(prev => ({ ...prev, nodoInicial: p.PostCodigoNodo, latitudIni: p.PostLatitud, longitudIni: p.PostLongitud }));
    };

    const onSelectPosteFin = (e) => {
        const p = e.value;
        setFormData(prev => ({ ...prev, nodoFinal: p.PostCodigoNodo, latitudFin: p.PostLatitud, longitudFin: p.PostLongitud }));
    };

    // Estilos
    const isEdit = !!formData.id;
    const headerColor = typeMode === 'POSTE' 
        ? (isEdit ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600') 
        : (isEdit ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600');
    const borderColor = typeMode === 'POSTE' ? 'border-blue-500' : 'border-orange-500';
    
    // Opciones estáticas (Ejemplo)
    const MATERIAL_OPTIONS = [{label:'Madera', value:1}, {label:'Concreto', value:2}, {label:'Metal', value:3}, {label:'Fibra', value:4}];
    const RETENIDA_OPTIONS = [{label:'Simple', value:1}, {label:'Doble', value:2}]; // Ajusta según tus datos reales

    return (
        <div className={`flex flex-col bg-white border-t-4 ${borderColor} shadow-sm mb-2 rounded-sm`}>
            {/* Cabecera */}
            <div className={`flex justify-between items-center px-3 py-2 border-b ${headerColor}`}>
                <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <i className={isEdit ? "pi pi-pencil" : "pi pi-plus"}></i>
                    {isEdit ? `EDITANDO ${typeMode}` : `NUEVO ${typeMode}`}
                </span>
                <div className="flex items-center gap-2">
                    <Button icon="pi pi-eraser" className="p-button-rounded p-button-text p-button-secondary w-8 h-8 p-0 flex items-center justify-center" onClick={() => {handleInternalClear(); onClear();}} tooltip="Limpiar" />
                    <Button label={isEdit ? "Actualizar" : "Guardar"} icon="pi pi-save" size="small" className={`p-button-sm h-8 text-xs font-bold ${typeMode==='POSTE'?'p-button-info':'p-button-warning'}`} onClick={handleSave} />
                </div>
            </div>

            {/* Formulario */}
            <div className="p-2 grid grid-cols-2 gap-3 text-xs">
                {/* Comunes */}
                <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">CÓDIGO GIS</label><InputText value={formData.codigo} onChange={(e)=>setFormData({...formData, codigo:e.target.value})} className="w-full p-inputtext-sm h-8 font-bold"/></div>
                <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">ETIQUETA</label><InputText value={formData.etiqueta} onChange={(e)=>setFormData({...formData, etiqueta:e.target.value})} className="w-full p-inputtext-sm h-8"/></div>
                <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">ALIMENTADOR</label><Dropdown value={formData.alimentadorId} options={feeders} onChange={(e)=>setFormData({...formData, alimentadorId:e.value})} optionLabel="label" optionValue="value" className="w-full h-8 flex items-center" placeholder="-"/></div>
                <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">SED</label><Dropdown value={formData.sedId} options={seds} onChange={(e)=>setFormData({...formData, sedId:e.value})} optionLabel="label" optionValue="sedInterno" className="w-full h-8 flex items-center" placeholder="-"/></div>

                {/* Postes */}
                {typeMode === 'POSTE' && (
                    <>
                        <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">LATITUD</label><InputNumber value={formData.latitud} onValueChange={(e)=>setFormData({...formData, latitud:e.value})} mode="decimal" minFractionDigits={6} className="w-full p-inputtext-sm h-8" inputClassName="py-1"/></div>
                        <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">LONGITUD</label><InputNumber value={formData.longitud} onValueChange={(e)=>setFormData({...formData, longitud:e.value})} mode="decimal" minFractionDigits={6} className="w-full p-inputtext-sm h-8" inputClassName="py-1"/></div>
                        <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">MATERIAL</label><Dropdown value={formData.materialPoste} options={MATERIAL_OPTIONS} onChange={(e)=>setFormData({...formData, materialPoste:e.value})} className="w-full h-8 flex items-center" editable placeholder="Escribe..."/></div>
                        <div className="col-span-1"><label className="font-bold text-gray-500 block mb-1">ALTURA (m)</label><InputNumber value={formData.altura} onValueChange={(e)=>setFormData({...formData, altura:e.value})} className="w-full p-inputtext-sm h-8" inputClassName="py-1"/></div>
                    </>
                )}

                {/* Vanos */}
                {typeMode === 'VANO' && (
                    <>
                        <div className="col-span-1">
                            <label className="font-bold text-blue-600 block mb-1">POSTE INICIAL</label>
                            <AutoComplete value={formData.nodoInicial} suggestions={suggestions} completeMethod={searchPoste} field="PostCodigoNodo" onSelect={onSelectPosteIni} onChange={(e)=>setFormData({...formData, nodoInicial:e.value})} className="w-full p-inputtext-sm h-8" inputClassName="w-full h-8"/>
                        </div>
                        <div className="col-span-1">
                            <label className="font-bold text-blue-600 block mb-1">POSTE FINAL</label>
                            <AutoComplete value={formData.nodoFinal} suggestions={suggestions} completeMethod={searchPoste} field="PostCodigoNodo" onSelect={onSelectPosteFin} onChange={(e)=>setFormData({...formData, nodoFinal:e.value})} className="w-full p-inputtext-sm h-8" inputClassName="w-full h-8"/>
                        </div>
                        <div className="col-span-1"><label className="font-bold text-gray-400 block mb-1 text-[10px]">LAT. INICIAL</label><InputNumber value={formData.latitudIni} mode="decimal" minFractionDigits={6} className="w-full p-inputtext-sm h-8 opacity-70" disabled/></div>
                        <div className="col-span-1"><label className="font-bold text-gray-400 block mb-1 text-[10px]">LON. INICIAL</label><InputNumber value={formData.longitudIni} mode="decimal" minFractionDigits={6} className="w-full p-inputtext-sm h-8 opacity-70" disabled/></div>
                        <div className="col-span-1"><label className="font-bold text-gray-400 block mb-1 text-[10px]">LAT. FINAL</label><InputNumber value={formData.latitudFin} mode="decimal" minFractionDigits={6} className="w-full p-inputtext-sm h-8 opacity-70" disabled/></div>
                        <div className="col-span-1"><label className="font-bold text-gray-400 block mb-1 text-[10px]">LON. FINAL</label><InputNumber value={formData.longitudFin} mode="decimal" minFractionDigits={6} className="w-full p-inputtext-sm h-8 opacity-70" disabled/></div>
                    </>
                )}
            </div>
        </div>
    );
}