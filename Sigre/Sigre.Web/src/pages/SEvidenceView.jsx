import React from 'react';
// ⚠️ Asegúrate de que estos nombres coincidan con tus archivos reales en la carpeta
import EvidenceInfo from './SEvidenceInfo'; 
import EvidenceGallery from './SEvidenceGallery';

export default function EvidenceView({ 
    selectedDeficiency, 
    feeder, 
    sed, 
    suministro, 
    my7004Correlativo, 
    onUpdateDeficiency 
}) {
    
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