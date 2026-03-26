import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useCloneDeficiency } from '../../hooks/useCloneDeficiency';

// 🔥 Importamos la lista estática maestra de opciones (ajusta tu ruta)
import { ALL_DEFICIENCY_OPTIONS } from '../../utils/deficiencyConfig'; // Asegúrate de tener esta lista bien definida

export default function CloneDeficiencyModal({ 
    visible, 
    onHide, 
    onCloneSuccess, 
    selectedDeficiency, 
    masterTypifications, 
    existingDeficiencies, // Necesitamos saber qué deficiencias ya existen
    getCodeById           // Necesitamos la función para traducir IDs a Códigos
}) {
    const [selectedTipi, setSelectedTipi] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    const { cloneDeficiency, isCloning } = useCloneDeficiency();

    useEffect(() => {
        if (visible) {
            setSelectedTipi(null);
            setErrorMsg('');
        }
    }, [visible]);

    // =========================================================================
    // 🔥 LÓGICA DE FILTRADO Y REGLAS DE NEGOCIO (Exclusión Mutua)
    // =========================================================================
    const typificationOptions = useMemo(() => {
        if (!selectedDeficiency || !masterTypifications || masterTypifications.length === 0) return [];

        const currentGis = selectedDeficiency.defiCodigoElemento?.trim().toUpperCase();
        const elementType = selectedDeficiency.defiTipoElemento;

        // 1. Identificar qué códigos ya están usados para este elemento GIS
        const usedCodes = existingDeficiencies
            .filter(d => d.defiActivo && d.defiCodigoElemento?.trim().toUpperCase() === currentGis)
            .map(d => getCodeById(d.tipiInterno));

        const hasCleanRecord = usedCodes.includes("0"); // ¿Ya tiene un "Sin Deficiencia"?
        const hasRealDeficiencies = usedCodes.some(code => code !== "0"); // ¿Ya tiene fallas reales?

        // 2. Filtrar la lista estática aplicando las reglas
        const validOptions = ALL_DEFICIENCY_OPTIONS.filter(opt => {
            // A. Filtro de Tipo (POSTE vs VANO)
            if (opt.code !== "0" && opt.type !== 'BOTH' && opt.type !== elementType) return false;

            // B. Regla de Exclusión Mutua
            if (opt.code === "0" && hasRealDeficiencies) return false; // Bloquear S/D si ya hay fallas
            if (opt.code !== "0" && hasCleanRecord) return false;      // Bloquear fallas si ya es S/D

            // C. Regla Anti-Duplicados (No puedes clonar y ponerle una tipificación que ya existe, excepto 7004)
            if (usedCodes.includes(opt.code) && opt.code !== '7004') return false;

            return true;
        });

        // 3. Cruzar con la BD para obtener los IDs (tipiInterno) requeridos por el dropdown
        return validOptions.map(staticOpt => {
            if (staticOpt.code === "0") {
                return { label: staticOpt.name, value: 0 };
            }
            const matchInDb = masterTypifications.find(t => String(t.code || t.tipiCodigo) === String(staticOpt.code));
            if (!matchInDb) return null;

            return {
                label: `${staticOpt.code} - ${staticOpt.name}`, // Formato visual claro
                value: Number(matchInDb.tipiInterno || matchInDb.typificationId)
            };
        }).filter(opt => opt !== null);

    }, [selectedDeficiency, existingDeficiencies, masterTypifications, getCodeById]);


    const handleClone = async () => {
        if (selectedTipi === null || !selectedDeficiency) return;
        setErrorMsg('');

        // 1. Extraemos el código visual (ej "6026")
        const opcionElegida = typificationOptions.find(o => o.value === selectedTipi);
        const nuevoCodigoTipi = opcionElegida && opcionElegida.value !== 0 ? opcionElegida.label.split(' - ')[0] : 'SINDEF';
        // 🔥 1.5 LÓGICA DE CARPETAS ESPECIALES (7004 y SINDEF)
        let folderPath = nuevoCodigoTipi; // Por defecto es el mismo código (ej "6026")
        
        if (nuevoCodigoTipi === "7004") {
            // Filtramos las deficiencias de este elemento que ya son 7004 (o cuyo ID interno equivale a 7004)
            const defs7004 = existingDeficiencies.filter(d => {
                const c = d.tipiCodigo || getCodeById(d.tipiInterno) || "";
                return String(c).trim() === "7004" || String(d.tipiInterno) === "60";
            });
            // Calculamos el siguiente correlativo
            const folderNum = defs7004.length + 1;
            folderPath = `7004/${folderNum}`; 
        } else if (nuevoCodigoTipi === "SINDEF" || nuevoCodigoTipi === "0") {
            folderPath = "SINDEF";
        }

        console.log(`📂 Ruta calculada para la copia física: ${folderPath}`);

        // 🔥 2. OBTENER USUARIO ACTUAL DEL FRONTEND (AUDITORÍA)
        let currentUserId = "20"; // Fallback por defecto
        try {
            const storedUser = localStorage.getItem('usuario');
            if (storedUser) {
                // Verificamos si es un objeto JSON (ej. {"id": 15, "nombre": "Admin"})
                if (storedUser.startsWith('{')) {
                    const userObj = JSON.parse(storedUser);
                    // Ajusta 'id' por el nombre de la propiedad que tenga tu objeto de usuario
                    currentUserId = userObj.usuaInterno ? userObj.usuaInterno.toString() : "20";
                } else {
                    // Si guardaron directo el string (ej. "15")
                    currentUserId = storedUser.toString();
                }
            }
            console.log("🔍 [DEBUG] Usuario que clona:", currentUserId);
        } catch (e) {
            console.error("Error obteniendo usuario del storage para clonación:", e);
        }

        // 3. Le mandamos los 4 parámetros al hook, incluyendo el usuario real
        const result = await cloneDeficiency(
            selectedDeficiency.defiInterno, 
            selectedTipi, 
            nuevoCodigoTipi, 
            currentUserId // Aquí viaja el dato limpio
        );

        if (result.success) {
            onCloneSuccess(result.data.nuevoId); 
            onHide(); 
        } else {
            setErrorMsg(result.error); 
        }
    };

    const footer = (
        <div className="flex justify-end gap-2 mt-4">
            <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text p-button-secondary" disabled={isCloning} />
            <Button label={isCloning ? "Clonando..." : "Confirmar Clon"} icon={isCloning ? "pi pi-spin pi-spinner" : "pi pi-copy"} onClick={handleClone} className="p-button-primary font-bold" disabled={selectedTipi === null || isCloning} />
        </div>
    );

    return (
        <Dialog header="Clonar Deficiencia y Evidencias" visible={visible} style={{ width: '450px' }} modal onHide={onHide} footer={footer}>
            <div className="flex flex-col gap-3 pt-2">
                <p className="text-sm text-gray-600 leading-relaxed">
                    Se creará una copia exacta de la deficiencia seleccionada (ID: <strong>{selectedDeficiency?.defiInterno}</strong>) para el elemento <strong>{selectedDeficiency?.defiCodigoElemento}</strong>. Se incluirá una copia física de todas sus fotos actuales.
                </p>

                {errorMsg && <Message severity="error" text={errorMsg} className="w-full justify-start text-xs" />}

                {typificationOptions.length === 0 && (
                    <Message severity="warn" text="No hay tipificaciones disponibles para clonar. El elemento ya posee todas las fallas posibles o un estado bloqueante." className="w-full justify-start text-xs mt-2" />
                )}

                <div className="flex flex-col bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
                    <label className="text-xs font-bold text-blue-800 uppercase mb-2">Selecciona la Nueva Tipificación *</label>
                    <Dropdown 
                        value={selectedTipi} 
                        onChange={(e) => setSelectedTipi(e.value)} 
                        options={typificationOptions} 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder={typificationOptions.length === 0 ? "Sin opciones disponibles" : "Buscar tipificación..."} 
                        className="w-full p-inputtext-sm font-bold" 
                        filter
                        disabled={typificationOptions.length === 0 || isCloning}
                    />
                </div>
            </div>
        </Dialog>
    );
}