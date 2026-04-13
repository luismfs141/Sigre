import React, { useState,useEffect,useMemo } from 'react';
import EvidenceInfo from './SEvidenceInfo'; 
import EvidenceGallery from './SEvidenceGallery';
import CloneSyncModal from '../components/Modals/CloneSyncModal';
import { Button } from 'primereact/button';
import { useFiles } from '../hooks/useFiles';
export default function EvidenceView({ 
    selectedDeficiency, 
    feeder, 
    sed, 
    suministro, 
    my7004Correlativo, 
    onUpdateDeficiency 
}) {
    
    const { files, loadFiles } = useFiles();
    const [showSync, setShowSync] = useState(false);

    useEffect(() => {
    if (selectedDeficiency?.defiInterno) {
        loadFiles(selectedDeficiency.defiInterno);
    }
}, [selectedDeficiency?.defiInterno, loadFiles]);

    // 🔥 2. LÓGICA DE DETECCIÓN DE CLON (Regla de > 24 hrs)
    const isClonedFlow = useMemo(() => {
        if (!selectedDeficiency) return false;
        try {
            const fRegistro = new Date(selectedDeficiency.defiFecRegistro || selectedDeficiency.FecRegistro);
            const fModif = new Date(selectedDeficiency.defiFecModificacion || selectedDeficiency.FecModificacion || new Date());
            
            // Si la fecha de modificación difiere de la de registro original por más de 24 horas, lo tratamos como clon.
            // (Si usas DefiUuid, también podrías validar: return !!selectedDeficiency.defiUuid;)
            return Math.abs(fModif - fRegistro) / (1000 * 60 * 60) > 24; 
        } catch (e) { 
            return false; 
        }
    },);


    const handleSaveInfo = (formData) => {
        if (onUpdateDeficiency) {
            onUpdateDeficiency(formData);
        }
    };

    // BLINDAJE: Si no hay selección, mostramos aviso
    if (!selectedDeficiency || !selectedDeficiency.defiInterno) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 border rounded-lg text-gray-400">
                <i className="pi pi-info-circle text-3xl mb-2 opacity-30"></i>
                <p className="text-sm font-medium">Selecciona un elemento</p>
            </div>
        );
    }

    return (
        // CAMBIO 1: flex-col para diseño vertical
        <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            
            {/* PARTE SUPERIOR: Galería (Ocupa el espacio sobrante, aprox 60-70%) */}
            <div className="flex-1 min-h-0 w-full bg-gray-50 border-b border-gray-200 relative">
                <EvidenceGallery 
                
                    deficiency={selectedDeficiency} 
                    feeder={feeder} 
                    sed={sed} 
                    suministro={suministro} 
                    my7004Correlativo={my7004Correlativo}
                />
            </div>
            {/* Botón flotante o discreto solo si es clon
        {isClonedFlow && (
        <div className="p-2 bg-amber-50 border-t border-b border-amber-200 flex justify-between items-center bg-opacity-90">
            <div className="flex items-center gap-2">
                <i className="pi pi-exclamation-triangle text-amber-600 font-bold"></i>
                <span className="text-[11px] text-amber-800 font-bold uppercase tracking-tight">
                    Registro Clonado: Las fotos requieren sincronización manual
                </span>
            </div>
            <Button 
                label="Sincronizar Fotos" 
                icon="pi pi-sync" 
                className="p-button-warning p-button-sm p-button-outlined h-8 text-[10px]" 
                onClick={() => setShowSync(true)}
            />
        </div>
    )}


        <CloneSyncModal 
            visible={showSync} 
            onHide={() => setShowSync(false)}
            deficiency={selectedDeficiency}
            photos={files}
            feeder={feeder}
            sed={sed}
        /> */}
    

            {/* PARTE INFERIOR: Ficha Técnica (Altura fija, ej. 350px) */}
            <div className="h-[450px] shrink-0 w-full bg-white relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <EvidenceInfo 
                    deficiency={selectedDeficiency} 
                    onSave={handleSaveInfo}
                />
            </div>

        </div>
    );
}