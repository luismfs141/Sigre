import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { useTechnicalInfo } from '../hooks/useTechnicalInfo'; 
import api from '../api/apiConfig'; 

export default function EvidenceInfo({ deficiency, onSave, loading }) {
    
    // LISTA DE MATERIALES
    const MATERIAL_OPTIONS = [
        { label: 'Madera', value: 1 },
        { label: 'C.A.C.', value: 2 },
        { label: 'Metálico', value: 3 },
        { label: 'Fibra de vidrio', value: 4 }
    ];

    // LISTA DE RETENIDAS
    const RETENIDA_OPTIONS = [
        { label: 'Retenida normal', value: 1 },
        { label: 'Retenida contra punta', value: 2 },
        { label: 'Retenida vertical', value: 3 },
        { label: 'Retenida aérea', value: 4 },
        { label: 'Sin retenida', value: 5 }
    ];

    const [formData, setFormData] = useState({
        codigoElemento: '',
        tipoElemento: 'POST', 
        interno: '',
        material: null,
        altura: null,
        idRetenida: 5, 
        nodoInicial: '',
        nodoFinal: ''
    });

    const [esTercero, setEsTercero] = useState(false);
    const [saving, setSaving] = useState(false);

    const { technicalInfo, loadingInfo, fetchTechnicalInfo, resetInfo } = useTechnicalInfo();

    useEffect(() => {
        if (deficiency) {
            setFormData({
                codigoElemento: deficiency.defiCodigoElemento || '',
                tipoElemento: deficiency.defiTipoElemento || 'POST',
                interno: deficiency.defiInterno || '',
                material: null,
                altura: null,
                idRetenida: 5,
                nodoInicial: '',
                nodoFinal: ''
            });
            resetInfo();
            setEsTercero(false); 
            
            if (deficiency.defiCodigoElemento) {
                fetchTechnicalInfo(deficiency.defiCodigoElemento);
            }
        }
    }, [deficiency, resetInfo, fetchTechnicalInfo]);

    useEffect(() => {
        if (technicalInfo) {
            if (technicalInfo.tercero !== undefined) setEsTercero(technicalInfo.tercero === 1 || technicalInfo.tercero === true);
            
            setFormData(prev => ({ 
                ...prev, 
                tipoElemento: technicalInfo.tipo === 'POSTE' ? 'POST' : 'VANO',
                material: technicalInfo.material, 
                altura: technicalInfo.altura, 
                idRetenida: (technicalInfo.tipoRetenida && technicalInfo.tipoRetenida > 0) ? technicalInfo.tipoRetenida : 5,
                nodoInicial: technicalInfo.nodoInicial || '',
                nodoFinal: technicalInfo.nodoFinal || ''
            }));
        }
    }, [technicalInfo]);

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = {
                DefiInterno: parseInt(formData.interno),
                EsTercero: esTercero,
                NodoInicial: formData.tipoElemento === 'VANO' ? formData.nodoInicial : "",
                NodoFinal: formData.tipoElemento === 'VANO' ? formData.nodoFinal : "",
                Material: formData.tipoElemento === 'POST' ? formData.material : null,
                Altura: formData.tipoElemento === 'POST' ? formData.altura : null,
                TipoRetenida: formData.tipoElemento === 'POST' ? formData.idRetenida : null 
            };

            await api.post('/Deficiency/ActualizarFichaTecnica', payload);
            
            if (onSave) onSave(payload); 
            fetchTechnicalInfo(formData.codigoElemento);

        } catch (error) {
            console.error("Error al actualizar ficha:", error);
        } finally {
            setSaving(false);
        }
    };

    if (!deficiency) return <div className="p-4 text-center text-gray-400">Sin selección</div>;

    const tipoLabel = formData.tipoElemento === 'POST' ? 'Poste' : 'Vano';

    return (
        <div className="h-full bg-white p-3 border-r border-gray-200 flex flex-col w-full overflow-y-auto">
            
            <div className="mb-3 border-b border-gray-100 pb-2 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center">
                    <i className="pi pi-map-marker mr-1 text-blue-500"></i> Identificación
                </h3>
                
                {/* TU BOTÓN ORIGINAL INTACTO */}
                <Button 
                    onClick={handleSubmit} 
                    disabled={saving || loading || !technicalInfo}
                    className="p-button-sm px-3 h-10 shadow-lg border-none flex items-center gap-2 hover:scale-105 transition-transform"
                    style={{ 
                        background: (saving || loading || !technicalInfo) ? undefined : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                        color: '#fff' 
                    }}
                >
                    <i className={`pi ${saving ? "pi-spin pi-spinner" : "pi-save"} text-lg font-bold`}></i>
                    <div className="flex flex-col items-start leading-none">
                        <span className="font-extrabold text-[10px] tracking-wide">
                            {saving ? "GUARDANDO..." : "GUARDAR"}
                        </span>
                        <span className="text-[9px] font-medium opacity-90">
                            FICHA TÉCNICA
                        </span>
                    </div>
                </Button>
            </div>

            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Tipo</label>
                        <InputText value={tipoLabel} readOnly className="p-inputtext-sm bg-gray-100 text-gray-600 font-semibold w-full border border-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Código GIS</label>
                        <InputText value={formData.codigoElemento} readOnly className="p-inputtext-sm font-bold text-gray-800 bg-gray-50 w-full border border-gray-400" />
                    </div>
                </div>

                {technicalInfo ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs shadow-sm relative">
                        <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-2">
                            <span className="font-bold text-blue-800 uppercase flex items-center gap-1">
                                <i className="pi pi-cog"></i> Ficha Técnica
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-3 gap-x-3">
                            {formData.tipoElemento === 'POST' && (
                                <>
                                    <div className="flex flex-col col-span-2">
                                        <span className="text-gray-500 text-[9px] uppercase font-semibold mb-1">Material</span>
                                        <Dropdown 
                                            value={formData.material} 
                                            options={MATERIAL_OPTIONS} 
                                            onChange={(e) => handleChange('material', e.value)}
                                            placeholder="Seleccione..."
                                            className="w-full p-inputtext-sm h-8 flex items-center border border-gray-400 shadow-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-[9px] uppercase font-semibold mb-1">Altura (m)</span>
                                        <InputNumber 
                                            value={formData.altura} 
                                            onValueChange={(e) => handleChange('altura', e.value)} 
                                            mode="decimal" 
                                            minFractionDigits={1} 
                                            className="p-inputtext-sm h-8 w-full border border-gray-400 rounded shadow-sm overflow-hidden"
                                            inputClassName="py-1 px-2 text-xs w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-[9px] uppercase font-semibold mb-1">Tipo Retenida</span>
                                        <Dropdown 
                                            value={formData.idRetenida} 
                                            options={RETENIDA_OPTIONS} 
                                            onChange={(e) => handleChange('idRetenida', e.value)}
                                            placeholder="Seleccione..."
                                            className="w-full p-inputtext-sm h-8 flex items-center border border-gray-400 shadow-sm"
                                        />
                                    </div>
                                </>
                            )}
                            
                            {formData.tipoElemento === 'VANO' && (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-[9px] uppercase font-semibold mb-1">Nodo Inicial</span>
                                        <InputText 
                                            value={formData.nodoInicial} 
                                            onChange={(e) => handleChange('nodoInicial', e.target.value)}
                                            className="p-inputtext-sm font-mono text-xs h-8 text-blue-700 font-bold border border-gray-400 shadow-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-[9px] uppercase font-semibold mb-1">Nodo Final</span>
                                        <InputText 
                                            value={formData.nodoFinal} 
                                            onChange={(e) => handleChange('nodoFinal', e.target.value)}
                                            className="p-inputtext-sm font-mono text-xs h-8 text-blue-700 font-bold border border-gray-400 shadow-sm"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-400 text-xs italic">{loadingInfo ? "Cargando..." : "Sin datos."}</div>
                )}

                <div className={`flex items-center justify-between p-2 rounded border border-gray-400 shadow-sm transition-colors ${esTercero ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">Estado Campo</span>
                        <span className={`text-[10px] font-bold ${esTercero ? 'text-orange-600' : 'text-green-600'}`}>
                            {esTercero ? "NO EXISTE" : "EXISTE "}
                        </span>
                    </div>
                    <Button 
                        icon={esTercero ? "pi pi-times" : "pi pi-check"} 
                        className={`p-button-rounded p-button-xs w-6 h-6 ${esTercero ? 'p-button-warning' : 'p-button-success'}`}
                        onClick={() => setEsTercero(!esTercero)}
                    />
                </div>
            </div>
        </div>
    );
}