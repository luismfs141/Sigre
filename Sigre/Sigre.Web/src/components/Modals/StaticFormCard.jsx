import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { AutoComplete } from 'primereact/autocomplete';

import { useFeeder, useSedsByFeeder } from '../../hooks/useFeeder';
import { useElements } from '../../hooks/useElement'; 

export default function StaticFormCard({ elementToEdit, typeMode, onClear, onSave, saving = false }) {
    
    // ... (Tu estado inicial se mantiene igual) ...
    const initialState = {
        id: 0, tipoElemento: typeMode, etiqueta: '', codigo: '',
        alimentadorId: null, sedId: null, 
        latitud: null, longitud: null, materialPoste: 2, altura: null, idRetenida: null,
        nodoInicial: '', nodoFinal: '',
        latitudIni: null, longitudIni: null, latitudFin: null, longitudFin: null
    };

    const [formData, setFormData] = useState(initialState);
    const [suggestions, setSuggestions] = useState([]);

    const { feeders } = useFeeder();
    const { seds } = useSedsByFeeder(formData.alimentadorId);
    const { fetchPostesChunk } = useElements();

    // ... (Tu useEffect se mantiene igual) ...
    useEffect(() => {
        if (elementToEdit) {
            console.log("Cargando elemento:", typeMode, elementToEdit);
            if (typeMode === 'POSTE') {
                setFormData({
                    id: elementToEdit.postInterno || elementToEdit.id,
                    tipoElemento: 'POSTE',
                    codigo: elementToEdit.postCodigoNodo || elementToEdit.codigo || '', 
                    etiqueta: elementToEdit.postEtiqueta || elementToEdit.etiqueta || '',
                    alimentadorId: elementToEdit.alimInterno, 
                    sedId: elementToEdit.postSubestacion,     
                    latitud: elementToEdit.postLatitud || elementToEdit.latitud,
                    longitud: elementToEdit.postLongitud || elementToEdit.longitud,
                    altura: elementToEdit.postAltura || elementToEdit.altura ,
                    materialPoste: elementToEdit.postMaterial || elementToEdit.materialPoste || 2,
                    idRetenida: elementToEdit.postRetenidaTipo || elementToEdit.idRetenida,
                    nodoInicial: '', nodoFinal: '', latitudIni: null, longitudIni: null, latitudFin: null, longitudFin: null
                });
            } else {
                setFormData({
                    id: elementToEdit.vanoInterno || elementToEdit.id,
                    tipoElemento: 'VANO',
                    codigo: elementToEdit.vanoCodigo || elementToEdit.codigo || '',
                    etiqueta: elementToEdit.vanoEtiqueta || elementToEdit.etiqueta || '',
                    alimentadorId: elementToEdit.alimInterno, 
                    sedId: elementToEdit.vanoSubestacion, 
                    nodoInicial: elementToEdit.vanoNodoInicial || elementToEdit.nodoInicial || '',
                    nodoFinal: elementToEdit.vanoNodoFinal || elementToEdit.nodoFinal || '',
                    latitudIni: elementToEdit.vanoLatitudIni || elementToEdit.latitudIni,
                    longitudIni: elementToEdit.vanoLongitudIni || elementToEdit.longitudIni,
                    latitudFin: elementToEdit.vanoLatitudFin || elementToEdit.latitudFin,
                    longitudFin: elementToEdit.vanoLongitudFin || elementToEdit.longitudFin,
                    latitud: null, longitud: null, altura: null, materialPoste: 2
                });
            }
        } else {
            setFormData(initialState);
        }
    }, [elementToEdit, typeMode]);

    const handleInternalClear = () => setFormData(initialState);

    // =========================================================================
    // 🔥 NUEVA FUNCIÓN WRAPPER PARA MAPEAR Y CONSOLE LOG 🔥
    // =========================================================================
const handleSaveWrapper = () => {
        let payloadToSend;

        if (typeMode === 'POSTE') {
            payloadToSend = {
                // 🔥 CRÍTICO: Agregamos esto para que saveElement sepa a dónde enviar
                tipoElemento: 'POSTE', 
                
                postInterno: formData.id,
                postCodigoNodo: formData.codigo,
                postEtiqueta: formData.etiqueta,
                alimInterno: formData.alimentadorId,
                postSubestacion: formData.sedId,
                postLatitud: formData.latitud,
                postLongitud: formData.longitud,
                postMaterial: formData.materialPoste,
                postAltura: formData.altura,
                postRetenidaTipo: formData.idRetenida || 5
            };
        } else {
            payloadToSend = {
                // 🔥 CRÍTICO: Agregamos esto aquí también
                tipoElemento: 'VANO',

                VanoInterno: formData.id,
                VanoCodigo: formData.codigo,
                VanoEtiqueta: formData.etiqueta,
                AlimInterno: formData.alimentadorId,
                VanoSubestacion: formData.sedId,
                
                VanoNodoInicial: formData.nodoInicial,
                VanoNodoFinal: formData.nodoFinal,
                VanoLatitudIni: formData.latitudIni,
                VanoLongitudIni: formData.longitudIni,
                VanoLatitudFin: formData.latitudFin,
                VanoLongitudFin: formData.longitudFin,

                VanoEsBt: true, 
                VanoEsMt: false,
                VanoInspeccionado: false,
                VanoTerceros: false,
                VanoMaterial: null
            };
        }

        console.group("🚀 PAYLOAD REAL");
        console.log("Endpoint destino:", typeMode === 'POSTE' ? '/Post/GuardarPosteWeb' : '/Gap/GuardarVanoWeb');
        console.log("Data:", payloadToSend);
        console.groupEnd();
        
        onSave(payloadToSend); 
    };

        

    // ... (Resto de funciones: searchPoste, itemTemplate, handleSelectPoste) ...
    const searchPoste = async (event) => {
        const result = await fetchPostesChunk(0, 15, event.query);
        setSuggestions(result.data || []);
    };

    const itemTemplate = (item) => (
        <div className="flex flex-col border-b border-gray-100 p-1">
            <span className="font-bold text-sm text-gray-800">{item.postEtiqueta || item.postCodigoNodo}</span>
            {item.postEtiqueta && <span className="text-[10px] text-blue-500 font-mono">GIS: {item.postCodigoNodo}</span>}
        </div>
    );

    const handleSelectPoste = (e, campoBase) => {
        const p = e.value;
        const valorParaGuardar = p.postEtiqueta || p.postCodigoNodo;
        const isInicio = campoBase === 'nodoInicial';
        setFormData(prev => ({
            ...prev,
            [campoBase]: valorParaGuardar,
            [isInicio ? 'latitudIni' : 'latitudFin']: p.postLatitud,
            [isInicio ? 'longitudIni' : 'longitudFin']: p.postLongitud
        }));
    };

    const isEdit = !!formData.id;
    const inputBorderClass = "border border-gray-300 rounded shadow-sm hover:border-blue-400 focus:border-blue-500 transition-colors";
    const MATERIAL_OPTIONS = [{label:'Madera', value:1}, {label:'Concreto', value:2}, {label:'Metal', value:3}, {label:'Fibra', value:4}];
    const isValid = formData.codigo && formData.alimentadorId; 

    return (
        <div className="w-full max-w-4xl mx-auto h-full"> 
            <div className={`flex flex-col bg-white border-t-4 ${typeMode === 'POSTE' ? 'border-blue-500' : 'border-green-500'} shadow-md rounded-lg h-[550px]`}>
                
                {/* === CABECERA === */}
                <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex-none">
                    <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 ${typeMode === 'POSTE' ? 'text-blue-700' : 'text-green-700'}`}>
                        <i className={`pi ${isEdit ? "pi-pencil" : "pi-plus-circle"} text-lg`}></i>
                        {isEdit ? `EDITANDO ${typeMode}` : `NUEVO ${typeMode}`}
                    </span>

                    <div className="flex items-center gap-3">
                        <Button icon="pi pi-eraser" className="p-button-rounded p-button-text p-button-secondary w-9 h-9 flex items-center justify-center hover:bg-gray-200" onClick={() => {handleInternalClear(); onClear();}} tooltip="Limpiar" />

                        <button
                            onClick={handleSaveWrapper} // <--- USAMOS EL WRAPPER AQUÍ
                            disabled={saving || !isValid}
                            className={`
                                group relative px-4 h-10 shadow-lg border-none flex items-center gap-3 rounded-md transition-all duration-200
                                ${(!isValid || saving) ? 'bg-gray-300 cursor-not-allowed grayscale opacity-70' : 'hover:scale-105 active:scale-95 cursor-pointer'}
                            `}
                            style={{ 
                                background: (!isValid || saving) ? undefined : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                                color: '#fff' 
                            }}
                        >
                            <i className={`pi ${saving ? "pi-spin pi-spinner" : "pi-save"} text-xl font-bold`}></i>
                            <div className="flex flex-col items-start leading-none">
                                <span className="font-extrabold text-[11px] tracking-wide">{saving ? "GUARDANDO..." : "GUARDAR"}</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* ... (El cuerpo del formulario se mantiene idéntico a tu versión anterior) ... */}
                 <div className="p-4 grid grid-cols-2 gap-4 text-xs flex-grow overflow-y-auto content-start">
                    
                    {/* --- DATOS GENERALES --- */}
                    <div className="col-span-1">
                        <label className="font-bold text-gray-600 block mb-1.5 ml-1">CÓDIGO GIS *</label>
                        <InputText value={formData.codigo} onChange={(e)=>setFormData({...formData, codigo:e.target.value})} className={`w-full p-inputtext-sm h-9 font-bold text-gray-700 ${inputBorderClass}`}/>
                    </div>
                    <div className="col-span-1">
                        <label className="font-bold text-gray-600 block mb-1.5 ml-1">ETIQUETA</label>
                        <InputText value={formData.etiqueta} onChange={(e)=>setFormData({...formData, etiqueta:e.target.value})} className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`}/>
                    </div>
                    <div className="col-span-1">
                        <label className="font-bold text-gray-600 block mb-1.5 ml-1">ALIMENTADOR *</label>
                        <Dropdown 
                            value={formData.alimentadorId} 
                            options={feeders} 
                            onChange={(e)=>{
                                setFormData({...formData, alimentadorId:e.value, sedId: null}); 
                            }} 
                            optionLabel="label" 
                            optionValue="value" 
                            className={`w-full h-9 flex items-center ${inputBorderClass}`} 
                            placeholder="Seleccione..."
                            filter
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="font-bold text-gray-600 block mb-1.5 ml-1">SUBESTACIÓN (SED)</label>
                        <Dropdown 
                            value={formData.sedId} 
                            options={seds} 
                            onChange={(e)=>setFormData({...formData, sedId:e.value})} 
                            optionLabel="label" 
                            optionValue="sedInterno" 
                            className={`w-full h-9 flex items-center ${inputBorderClass}`} 
                            placeholder="Seleccione..."
                            filter
                            disabled={!formData.alimentadorId}
                            emptyMessage="Seleccione Alimentador primero"
                        />
                    </div>

                    {/* --- CAMPOS ESPECÍFICOS: POSTE --- */}
                    {typeMode === 'POSTE' && (
                        <>
                            <div className="col-span-2 border-t border-gray-100 my-1"></div>
                            
                            <div className="col-span-1">
                                <label className="font-bold text-gray-600 block mb-1.5 ml-1">LATITUD</label>
                                <InputNumber value={formData.latitud} onValueChange={(e)=>setFormData({...formData, latitud:e.value})} mode="decimal" minFractionDigits={8} maxFractionDigits={15} useGrouping={false} className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`} inputClassName="py-2"/>
                            </div>
                            <div className="col-span-1">
                                <label className="font-bold text-gray-600 block mb-1.5 ml-1">LONGITUD</label>
                                <InputNumber value={formData.longitud} onValueChange={(e)=>setFormData({...formData, longitud:e.value})} mode="decimal" minFractionDigits={8} maxFractionDigits={15} useGrouping={false} className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`} inputClassName="py-2"/>
                            </div>

                            <div className="col-span-2 mt-2">
                                <label className="font-bold text-gray-600 block mb-1.5 ml-1">MATERIAL DEL POSTE</label>
                                <Dropdown value={formData.materialPoste} options={MATERIAL_OPTIONS} onChange={(e)=>setFormData({...formData, materialPoste:e.value})} className={`w-full h-9 flex items-center ${inputBorderClass}`} editable placeholder="Seleccione..."/>
                            </div>
                            
                            <div className="col-span-2">
                                <label className="font-bold text-gray-600 block mb-1.5 ml-1">ALTURA (m)</label>
                                <InputNumber 
                                    value={formData.altura} 
                                    onValueChange={(e)=>setFormData({...formData, altura:e.value})} 
                                    className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`} 
                                    inputClassName="py-2 font-bold text-blue-800"
                                    min={0} max={30} showButtons buttonLayout="horizontal" step={1}
                                    decrementButtonClassName="p-button-secondary opacity-50" incrementButtonClassName="p-button-secondary opacity-50" 
                                    incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                                />
                            </div>
                        </>
                    )}

                    {/* --- CAMPOS ESPECÍFICOS: VANO --- */}
                    {typeMode === 'VANO' && (
                        <div className="col-span-2 flex flex-col gap-5 mt-1">
                            
                            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/40 relative mt-2">
                                <div className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-bold text-blue-600 border border-blue-200 rounded-full shadow-sm">NODO INICIAL</div>
                                <div className="flex flex-row gap-4 mt-1">
                                    <div className="w-1/2">
                                        <label className="font-bold text-blue-600 block mb-1.5 text-[11px]">POSTE O ETIQUETA</label>
                                        <AutoComplete 
                                            value={formData.nodoInicial} suggestions={suggestions} completeMethod={searchPoste} 
                                            itemTemplate={itemTemplate} field="postCodigoNodo" 
                                            onSelect={(e) => handleSelectPoste(e, 'nodoInicial')} 
                                            onChange={(e) => setFormData({...formData, nodoInicial: e.value.postEtiqueta || e.value.postCodigoNodo || e.value})}
                                            className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`} inputClassName="w-full h-9 font-bold border-none" placeholder="Buscar..."
                                        />
                                    </div>
                                    <div className="w-1/4"><label className="font-bold text-gray-500 block mb-1.5 text-[10px]">LATITUD</label><InputNumber value={formData.latitudIni} mode="decimal" minFractionDigits={8} maxFractionDigits={15} useGrouping={false} className={`w-full p-inputtext-sm h-9 opacity-70 ${inputBorderClass}`} inputClassName="w-full h-9 text-xs bg-gray-100 border-none" disabled /></div>
                                    <div className="w-1/4"><label className="font-bold text-gray-500 block mb-1.5 text-[10px]">LONGITUD</label><InputNumber value={formData.longitudIni} mode="decimal" minFractionDigits={8} maxFractionDigits={15} useGrouping={false} className={`w-full p-inputtext-sm h-9 opacity-70 ${inputBorderClass}`} inputClassName="w-full h-9 text-xs bg-gray-100 border-none" disabled /></div>
                                </div>
                            </div>

                            <div className="p-4 border border-green-200 rounded-lg bg-green-50/40 relative mt-2">
                                <div className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-bold text-green-600 border border-green-200 rounded-full shadow-sm">NODO FINAL</div>
                                <div className="flex flex-row gap-4 mt-1">
                                    <div className="w-1/2">
                                        <label className="font-bold text-green-600 block mb-1.5 text-[11px]">POSTE O ETIQUETA</label>
                                        <AutoComplete 
                                            value={formData.nodoFinal} suggestions={suggestions} completeMethod={searchPoste} 
                                            itemTemplate={itemTemplate} field="postCodigoNodo" 
                                            onSelect={(e) => handleSelectPoste(e, 'nodoFinal')} 
                                            onChange={(e) => setFormData({...formData, nodoFinal: e.value.postEtiqueta || e.value.postCodigoNodo || e.value})}
                                            className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`} inputClassName="w-full h-9 font-bold border-none" placeholder="Buscar..."
                                        />
                                    </div>
                                    <div className="w-1/4"><label className="font-bold text-gray-500 block mb-1.5 text-[10px]">LATITUD</label><InputNumber value={formData.latitudFin} mode="decimal" minFractionDigits={8} maxFractionDigits={15} useGrouping={false} className={`w-full p-inputtext-sm h-9 opacity-70 ${inputBorderClass}`} inputClassName="w-full h-9 text-xs bg-gray-100 border-none" disabled /></div>
                                    <div className="w-1/4"><label className="font-bold text-gray-500 block mb-1.5 text-[10px]">LONGITUD</label><InputNumber value={formData.longitudFin} mode="decimal" minFractionDigits={8} maxFractionDigits={15} useGrouping={false} className={`w-full p-inputtext-sm h-9 opacity-70 ${inputBorderClass}`} inputClassName="w-full h-9 text-xs bg-gray-100 border-none" disabled /></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}