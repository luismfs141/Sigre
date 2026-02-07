import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';

export default function PhotoUploadModal({ 
    visible, 
    onHide, 
    onSave, 
    isEditing, 
    initialData, 
    currentPhotos = [] 
}) {
    const toast = useRef(null);
    const [formData, setFormData] = useState(initialData);

    // 1. TIPOS BASE (Sin el 0)
    const tiposBase = [
        { label: '1 - Panorámica', value: 1 },
        { label: '2 - Frontal', value: 2 },
        { label: '3 - Izquierda', value: 3 },
        { label: '4 - Derecha', value: 4 },
        { label: '5 - Medidor', value: 5 },
        { label: '6 - Adicional', value: 6 }
    ];

    // 2. LÓGICA DE FILTRADO (CORREGIDA)
    const tiposDisponibles = useMemo(() => {
        const tiposUsados = currentPhotos.map(foto => {
            const tipo = foto.archTipo || foto.ARCH_Tipo;
            return tipo ? parseInt(tipo, 10) : null;
        });

        return tiposBase.map(t => {
            // ✅ Variable definida correctamente
            const estaUsado = tiposUsados.includes(t.value);
            
            const esElMismo = isEditing && parseInt(initialData.tipo, 10) === t.value;

            // ✅ CORRECCIÓN: Usamos 'estaUsado' aquí
            if (estaUsado && !esElMismo) {
                return {
                    ...t,
                    disabled: true, 
                    label: `${t.label} (Existente)`
                };
            }
            return { ...t, disabled: false };
        });
    }, [currentPhotos, isEditing, initialData]);

    useEffect(() => { setFormData(initialData); }, [initialData, visible]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setFormData(prev => ({ ...prev, file: file, preview: URL.createObjectURL(file) }));
    };

    const handleSaveClick = () => {
        if (!formData.file && !formData.preview) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falta seleccionar foto.' }); 
            return; 
        }
        if (!formData.tipo) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Seleccione Tipo.' }); 
            return; 
        }
        
        const opcion = tiposDisponibles.find(t => t.value === formData.tipo);
        if (opcion?.disabled) {
            toast.current.show({ severity: 'warn', summary: 'Aviso', detail: 'Ese tipo de foto ya existe.' });
            return;
        }

        onSave(formData);
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog visible={visible} onHide={onHide} header={isEditing ? "Editar Foto" : "Nueva Evidencia"} style={{ width: '90vw', maxWidth: '400px' }} modal className="p-fluid">
                <div className="flex flex-col gap-4 pt-2">
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Tipo de Foto</label>
                        <Dropdown 
                            value={formData.tipo} 
                            options={tiposDisponibles} 
                            optionLabel="label"
                            optionValue="value"
                            optionDisabled="disabled" 
                            onChange={(e) => setFormData({...formData, tipo: e.value})} 
                            className="w-full" 
                            placeholder="Seleccione..."
                        />
                    </div>

                    <div className="border-2 border-dashed border-gray-300 p-4 rounded bg-gray-50 text-center relative cursor-pointer hover:bg-gray-100 group">
                        <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"/>
                        {formData.preview ? (
                            <img src={formData.preview} className="h-40 mx-auto object-contain rounded shadow-sm" alt="prev"/>
                        ) : (
                            <div className="flex flex-col items-center py-4 text-gray-400 group-hover:text-blue-500">
                                <i className="pi pi-camera text-3xl mb-2"></i>
                                <span className="font-semibold text-sm">Toque para subir</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700">Fecha Registro</label>
                        <Calendar 
                            value={formData.date} 
                            onChange={(e) => setFormData({...formData, date: e.value})} 
                            showTime 
                            showIcon 
                            className="w-full" 
                            dateFormat="dd/mm/yy" 
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-500">Latitud</label>
                            <InputText value={formData.lat} onChange={(e)=>setFormData({...formData, lat:e.target.value})} className="p-inputtext-sm font-mono text-xs"/>
                        </div>
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-500">Longitud</label>
                            <InputText value={formData.long} onChange={(e)=>setFormData({...formData, long:e.target.value})} className="p-inputtext-sm font-mono text-xs"/>
                        </div>
                    </div>

                    <Button label={isEditing ? "Actualizar" : "Guardar Evidencia"} icon="pi pi-save" onClick={handleSaveClick} disabled={!formData.file && !formData.preview} severity="success" className="mt-2" />
                </div>
            </Dialog>
        </>
    );
}