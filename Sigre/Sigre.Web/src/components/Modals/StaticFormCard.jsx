import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { AutoComplete } from 'primereact/autocomplete';

import { useFeeder, useSedsByFeeder } from '../../hooks/useFeeder';
import { useElements } from '../../hooks/useElement'; 
import { usePosteVanoSearch } from '../../hooks/usePosteVanoSearch';
import { useNodeSearch } from '../../hooks/useNodeSearch';
export default function StaticFormCard({ elementToEdit, typeMode, onClear, onSave, saving = false }) {
    
    // ... (Tu estado inicial se mantiene igual) ...
    const initialState = {
        id: 0, tipoElemento: typeMode, etiqueta: '', codigo: '',
        alimentadorId: null, sedId: null, 
        latitud: null, longitud: null, materialPoste: 2, altura: null, idRetenida: null,
        nodoInicial: '', nodoFinal: '',
        latitudIni: null, longitudIni: null, latitudFin: null, longitudFin: null,terceros: false
    };

    const [formData, setFormData] = useState(initialState);
    const [isSearchingCode, setIsSearchingCode] = useState(false);
    const [gisError, setGisError] = useState('');
    const { feeders } = useFeeder();
    const { seds } = useSedsByFeeder(formData.alimentadorId);
    const { fetchPostesChunk, fetchVanosChunk } = useElements(); 
    // 2. Instancias el buscador pasándole las dependencias
    const { suggestions, searchNode, searchExactCode,validateGisGlobal } = usePosteVanoSearch(fetchPostesChunk, fetchVanosChunk);
    // Genera un código aleatorio de exactamente 12 caracteres
// 🔥 NUEVA FUNCIÓN: Fuerza el formato exacto de 12 caracteres según el tipo
    const formatGisCode = (code, type) => {
        // Extraemos solo los números de lo que digitó el usuario
        const numbers = code.replace(/[^0-9]/g, '');
        
        if (type === 'POSTE') {
            // SGRPOST (7 letras) + 5 números = 12 caracteres
            const padded = numbers.padStart(5, '0').slice(-5);
            return `SGRPOST${padded}`;
        } else {
            // SGRVBT (6 letras) + 6 números = 12 caracteres
            const padded = numbers.padStart(6, '0').slice(-6);
            return `SGRVBT${padded}`;
        }
    };
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
                    nodoInicial: '', nodoFinal: '', latitudIni: null, longitudIni: null, latitudFin: null, longitudFin: null,
                    terceros: elementToEdit.postTerceros || false,
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
                    latitud: null, longitud: null, altura: null, materialPoste: 2, terceros: elementToEdit.vanoTerceros || false
                });
            }
        } else {
            // Inicia limpio sin generar código random
            setFormData({
                ...initialState,
                tipoElemento: typeMode,
                codigo: '' 
            });
        }
    }, [elementToEdit, typeMode]);

    // Función para verificar si el GIS existe cruzándolo con el Alimentador y SED
const handleVerifyElement = async () => {
    // 1. Validar que los 3 campos obligatorios estén llenos
    if (!formData.codigo || !formData.alimentadorId || !formData.sedId) return;
    setGisError('');

    setIsSearchingCode(true);
    
    // 2. Ejecutar la búsqueda en el backend
    const match = await searchExactCode(formData.codigo, formData.alimentadorId, formData.sedId);
    
    setIsSearchingCode(false);

    if (match) {
        // 🔥 SI EXISTE: Simulamos el comportamiento del botón "Editar" (Lápiz)
        console.log("Elemento encontrado en BD, cargando datos para edición...", match);
        
        if (match._tipo === 'POSTE') {
            setFormData(prev => ({
                ...prev,
                id: match.postInterno || match.id, // ID > 0 significa MODO EDICIÓN
                tipoElemento: 'POSTE',
                etiqueta: match.postEtiqueta || match.etiqueta || '',
                latitud: match.postLatitud || match.latitud,
                longitud: match.postLongitud || match.longitud,
                altura: match.postAltura || match.altura ,
                materialPoste: match.postMaterial || match.materialPoste || 2,
                idRetenida: match.postRetenidaTipo || match.idRetenida,
                terceros: match.postTerceros || false,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                id: match.vanoInterno || match.id, // ID > 0 significa MODO EDICIÓN
                tipoElemento: 'VANO',
                etiqueta: match.vanoEtiqueta || match.etiqueta || '',
                nodoInicial: match.vanoNodoInicial || match.nodoInicial || '',
                nodoFinal: match.vanoNodoFinal || match.nodoFinal || '',
                latitudIni: match.vanoLatitudIni || match.latitudIni,
                longitudIni: match.vanoLongitudIni || match.longitudIni,
                latitudFin: match.vanoLatitudFin || match.latitudFin,
                longitudFin: match.vanoLongitudFin || match.longitudFin,
                terceros: match.vanoTerceros || false
            }));
        }
    } else {
           const isTakenGlobally = await validateGisGlobal(formData.codigo);
            
            if (isTakenGlobally) {
                // ❌ EL CÓDIGO ORIGINAL YA EXISTE EN OTRO ALIMENTADOR/SED
                setIsSearchingCode(false);
                setGisError(
                    <>
                        <span className="block">El código {formData.codigo}</span>
                        <span className="block">ya pertenece a otro elemento en la BD.</span>
                    </>
                );
                return; // Bloqueamos el flujo aquí. NO formateamos.
            }

            // 🚀 3. SI EL CÓDIGO ORIGINAL ESTÁ LIBRE: Ahora sí, formateamos para crear
            const codigoFormateado = formatGisCode(formData.codigo, typeMode);
            
            // Hacemos una última validación de seguridad por si el código autocompletado ya existe
            const isFormattedTakenGlobally = await validateGisGlobal(codigoFormateado);
            setIsSearchingCode(false);

            if (isFormattedTakenGlobally) {
                setGisError(`El código adaptado (${codigoFormateado}) ya está en uso.`);
                setFormData(prev => ({ ...prev, codigo: codigoFormateado }));
            } else {
                // ✅ TOTALMENTE LIBRE: Limpiamos formulario y cargamos el código formateado a 12 dígitos
                console.log(`Código libre y adaptado a: ${codigoFormateado} para creación.`);
                setFormData(prev => ({
                    ...prev,
                    id: 0, 
                    codigo: codigoFormateado, 
                    etiqueta: '', latitud: null, longitud: null, altura: null,
                    nodoInicial: '', nodoFinal: '', latitudIni: null, longitudIni: null, latitudFin: null, longitudFin: null
                }));
            }
        }
    };
const handleInternalClear = () => {
        // Limpiamos totalmente el form
        setFormData({
            ...initialState,
            tipoElemento: typeMode,
            codigo: ''
        });
        // 🔥 AGREGAMOS ESTO: Limpiamos también el error visual
        setGisError('');
    };

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
                postRetenidaTipo: formData.idRetenida || 5,
                postTerceros: formData.terceros,
            };
        } else {
            payloadToSend = {
                // 🔥 CRÍTICO: Agregamos esto aquí también
                tipoElemento: 'VANO',

                VanoInterno: formData.id,
                VanoCodigo: formData.codigo,
                VanoEtiqueta: formData.etiqueta || ".",
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
                VanoTerceros: formData.terceros,
                VanoMaterial: null
            };
        }

        console.group("🚀 PAYLOAD REAL");
        console.log("Endpoint destino:", typeMode === 'POSTE' ? '/Post/GuardarPosteWeb' : '/Gap/GuardarVanoWeb');
        console.log("Data:", payloadToSend);
        console.groupEnd();
        
        onSave(payloadToSend); 
    };

        

const itemTemplate = (item) => {
        const esSed = item._tipo === 'SED';
        
        return (
            <div className={`flex flex-col border-b border-gray-100 p-2 ${esSed ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* ÍCONO: Edificio para SED, Rayo para Poste */}
                        <i className={`pi ${esSed ? 'pi-building text-orange-600' : 'pi-bolt text-blue-600'} text-sm`}></i>
                        
                        <div className="flex flex-col">
                            <span className={`font-bold text-xs ${esSed ? 'text-orange-800' : 'text-gray-700'}`}>
                                {esSed ? item.label : (item.postEtiqueta || "S/N")}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                                {esSed ? "SUBESTACIÓN (SED)" : `GIS: ${item.postCodigoNodo}`}
                            </span>
                        </div>
                    </div>
                    
                    {/* Badge lateral opcional */}
                    {esSed && <span className="text-[9px] bg-orange-200 text-orange-800 px-1 rounded">SED</span>}
                </div>
            </div>
        );
    };

    const handleSelectNode = (e, campoBase) => {
        const item = e.value;
        const isInicio = campoBase === 'nodoInicial';
        
        // Determinamos el valor a guardar en el input de texto
        // Si es SED, guardamos su código/nombre. Si es Poste, su etiqueta o código.
        const valorTexto = item._tipo === 'SED' 
            ? (item.label || "").split(' - ')[0] // O item.sedCodigo
            : (item.postEtiqueta || item.postCodigoNodo);

        // Obtenemos coordenadas (Asegúrate que tu objeto SED tenga lat/lon)
        // En la búsqueda (paso 1) ya mapeamos las coords de la SED a postLatitud/postLongitud para facilitar esto,
        // pero si tu objeto original es distinto, ajusta aquí.
        const lat = item.postLatitud || item.sedLatitud || item.latitud;
        const lon = item.postLongitud || item.sedLongitud || item.longitud;

        setFormData(prev => ({
            ...prev,
            [campoBase]: valorTexto,
            [isInicio ? 'latitudIni' : 'latitudFin']: lat,
            [isInicio ? 'longitudIni' : 'longitudFin']: lon
        }));
    };
    const isEdit = !!formData.id;
    const inputBorderClass = "border border-gray-300 rounded shadow-sm hover:border-blue-400 focus:border-blue-500 transition-colors";
    const MATERIAL_OPTIONS = [{label:'Madera', value:1}, {label:'Concreto', value:2}, {label:'Metal', value:3}, {label:'Fibra', value:4}];
    // Verificamos que los campos obligatorios estén llenos
    const tieneCamposBasicos = Boolean(formData.codigo && formData.alimentadorId && formData.sedId);
    
    // Verificamos que NO haya ningún mensaje de error
    const noHayErrorGis = gisError === '' || gisError === null;

    // El formulario solo es válido si tiene los datos básicos Y no hay error
    const isValid = tieneCamposBasicos && noHayErrorGis;
    

    return (
        <div className="w-full max-w-4xl mx-auto h-full"> 
            <div className={`flex flex-col bg-white border-t-4 ${typeMode === 'POSTE' ? 'border-blue-500' : 'border-green-500'} shadow-md rounded-lg h-[470px]`}>
                
                {/* === CABECERA === */}
                <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex-none">
                    <span className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 ${typeMode === 'POSTE' ? 'text-blue-700' : 'text-green-700'}`}>
                        <i className={`pi ${isEdit ? "pi-pencil" : "pi-plus-circle"} text-lg`}></i>
                        {isEdit ? `EDITANDO ${typeMode}` : `NUEVO ${typeMode}`}
                    </span>
<div className="col-span-2 flex justify-end mt-1 mb-2 border-b border-gray-100 pb-3">
    <Button 
        label={`VERIFICAR ${typeMode}`}
        icon={isSearchingCode ? "pi pi-spin pi-spinner" : "pi pi-check-circle"} 
        onClick={handleVerifyElement}
        disabled={!formData.codigo || !formData.alimentadorId || !formData.sedId || isSearchingCode}
        className="p-button-outlined p-button-info h-9 text-xs font-bold px-5"
        tooltip="Verifica si existe para editar, o prepara para crear uno nuevo"
    />
</div>

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
    <InputText 
        value={formData.codigo || ''} 
        onChange={(e) => {
            setFormData({...formData, codigo: e.target.value.toUpperCase()});
            setGisError(''); // 🔥 Limpiamos el error en cuanto el usuario empiece a escribir otro código
        }}
onKeyDown={(e) => e.key === 'Enter' && handleVerifyElement()}
        // Cambiamos el borde a rojo si hay un error
        className={`w-full p-inputtext-sm h-9 font-bold text-gray-700 ${gisError ? 'border-red-500 bg-red-50 focus:border-red-600' : inputBorderClass}`}
    />
    {/* Mensajito de error debajo del input */}
    {gisError && <small className="text-red-600 font-bold ml-1 mt-1 block">{gisError}</small>}
</div>
<div className="col-span-1">
    <label className="font-bold text-gray-600 block mb-1.5 ml-1">ALIMENTADOR *</label>
    <Dropdown 
        value={formData.alimentadorId} 
        options={feeders} 
        onChange={(e)=>setFormData({...formData, alimentadorId:e.value, sedId: null})} 
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
    />
</div>
{/* ESTADO DEL CAMPO (SOLO VISIBLE AL EDITAR) */}
{isEdit && (
    <div className="col-span-1 flex items-end">
        <div className={`w-full flex items-center justify-between p-1.5 rounded border border-gray-300 shadow-sm transition-colors ${formData.terceros ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`} style={{height: '36px'}}>
            <div className="flex flex-row items-center gap-2 pl-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase">EXISTE:</span>
                <span className={`text-[10px] font-extrabold ${formData.terceros ? 'text-orange-600' : 'text-green-600'}`}>
                    {formData.terceros ? "NO" : "SI"}
                </span>
            </div>
            <Button 
                icon={formData.terceros ? "pi pi-times" : "pi pi-check-circle"} 
                className={`p-button-rounded p-button-xs w-6 h-6 mr-1 ${formData.terceros ? 'p-button-warning' : 'p-button-success'}`}
                onClick={() => setFormData({...formData, terceros: !formData.terceros})}
                tooltip={formData.terceros ? "Cambiar que existe" : "Marcar como no existe"}
            />
        </div>
    </div>
)}

                    {/* --- CAMPOS ESPECÍFICOS: POSTE --- */}
                    {typeMode === 'POSTE' && (
                        <>
                            <div className="col-span-2 border-t border-gray-100 my-1"></div>
                                                <div className="col-span-1">
                        <label className="font-bold text-gray-600 block mb-1.5 ml-1">ETIQUETA</label>
                        <InputText value={formData.etiqueta} onChange={(e)=>setFormData({...formData, etiqueta:e.target.value})} className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`}/>
                    </div>
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
    <label className="font-bold text-blue-600 block mb-1.5 text-[11px]">POSTE, SED O ETIQUETA</label>
    <AutoComplete 
        value={formData.nodoInicial} 
        suggestions={suggestions} 
        completeMethod={(e) => searchNode(e.query, formData.alimentadorId, formData.sedId)}
        itemTemplate={itemTemplate} 
        field="postCodigoNodo" 
        onSelect={(e) => handleSelectNode(e, 'nodoInicial')} 
        onChange={(e) => {
            const val = e.value?.postEtiqueta || e.value?.postCodigoNodo || e.value?.label || e.value;
            setFormData({...formData, nodoInicial: val});
        }}
        className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`} 
        inputClassName="w-full h-9 font-bold border-none" 
        
        // 1. PLACEHOLDER DINÁMICO MEJORADO
        placeholder={
            !formData.alimentadorId ? "Seleccione Alimentador primero..." : 
            !formData.sedId ? "Seleccione SED primero..." : 
            "Buscar Poste o SED..."
        }
        
        // 2. BLOQUEO MÁS ESTRICTO: Se bloquea si falta el alimentador O falta la SED
        disabled={!formData.alimentadorId || !formData.sedId} 
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
    <label className="font-bold text-green-600 block mb-1.5 text-[11px]">POSTE, SED O ETIQUETA</label>
    <AutoComplete 
        value={formData.nodoFinal} 
        suggestions={suggestions} 
        completeMethod={(e) => searchNode(e.query, formData.alimentadorId, formData.sedId)}        itemTemplate={itemTemplate} 
        field="postCodigoNodo" 
        onSelect={(e) => handleSelectNode(e, 'nodoFinal')} 
        onChange={(e) => {
            // Se agregó ?. por seguridad al escribir libremente
            const val = e.value?.postEtiqueta || e.value?.postCodigoNodo || e.value?.label || e.value;
            setFormData({...formData, nodoFinal: val});
        }}
        className={`w-full p-inputtext-sm h-9 ${inputBorderClass}`} 
        inputClassName="w-full h-9 font-bold border-none" 
        
        // 1. PLACEHOLDER DINÁMICO IDÉNTICO AL INICIAL
        placeholder={
            !formData.alimentadorId ? "Seleccione Alimentador primero..." : 
            !formData.sedId ? "Seleccione SED primero..." : 
            "Buscar Poste o SED..."
        }
        
        // 2. BLOQUEO ESTRICTO (Alimentador y SED son obligatorios)
        disabled={!formData.alimentadorId || !formData.sedId} 
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