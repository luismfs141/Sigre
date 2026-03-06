import React, { useState, useRef, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { Image } from 'primereact/image';
import { Toolbar } from 'primereact/toolbar';
import { Message } from 'primereact/message';
import JSZip from 'jszip'; 
import { saveAs } from 'file-saver'; 

// --- HOOKS ---
import { useDeficiencyByGis } from '../hooks/useDeficiency';
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';
import { useTypification } from '../hooks/useTypification';
import { useFiles } from '../hooks/useFiles';
import { useElements } from '../hooks/useElement';
import { usePosteVanoSearch } from '../hooks/usePosteVanoSearch'; 

// --- COMPONENTES HIJOS Y UTILIDADES ---
import PhotoUploadModal from '../components/Modals/PhotoUploadModal';
import { latLonToUTM } from '../utils/geoUtils';

// 🔥 CONEXIÓN AL SERVIDOR NGROK
const API_BASE_URL = "https://subobscure-hilda-audacious.ngrok-free.dev"; 

// --- DICCIONARIOS Y AYUDANTES ---
const photoTypes = { 1: 'Panorámica', 2: 'Frontal', 3: 'Izquierda', 4: 'Derecha', 5: 'Medidor', 6: 'Adicional', 0: 'Otro' };

const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

function formatCompactDate(date) {
    if (!date) return "00000000-000000";
    const d = new Date(date);
    if(isNaN(d.getTime())) return "00000000-000000";
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`; 
}

const toLocalISOString = (date) => {
    if (!date) return null;
    const tzOffset = date.getTimezoneOffset() * 60000; 
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
};

function resolveFeederName(feederObj) {
    if (!feederObj) return "SIN_ALIMENTADOR";
    let lbl = feederObj.label || "";
    lbl = lbl.replace(/[0-9]/g, '').replace(/-/g, '').trim();
    return safeSeg(lbl);
}

// ==============================================================================
// 🚀 COMPONENTE PRINCIPAL UNIFICADO
// ==============================================================================
export default function WebInspectionManager() {
    const toast = useRef(null);

    // --- 1. ESTADOS DE BÚSQUEDA Y CONFIGURACIÓN ---
    const { feeders } = useFeeder();
    const [selectedFeederId, setSelectedFeederId] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);
    const [filteredSeds, setFilteredSeds] = useState([]);
    const [pendingSedId, setPendingSedId] = useState(null);

    const { seds: sedsDelAlimentador } = useSedsByFeeder(selectedFeederId);

    const { fetchByGis, loading: searchLoading } = useDeficiencyByGis();
    const [structureCode, setStructureCode] = useState('');
    const [structureType, setStructureType] = useState('POST');
    const [structureIdInt, setStructureIdInt] = useState(0);

    const [globalTipificacion, setGlobalTipificacion] = useState('');
    const [globalDate, setGlobalDate] = useState('');
    const [globalLat, setGlobalLat] = useState('');
    const [globalLon, setGlobalLon] = useState('');

    // --- 2. ESTADOS DE DATOS E HISTORIAL ---
    const { files: dbFiles, loadFiles, deleteFile, addFile, loadingFiles } = useFiles();
    const { getCodeById, fetchTypificationsByTypeElement, masterTypifications } = useTypification();
    const { fetchPostesChunk, fetchVanosChunk } = useElements();

    const [historicalData, setHistoricalData] = useState([]);
    const [selectedDeficiency, setSelectedDeficiency] = useState(null);

    // --- 3. ESTADOS DE LA TABLA/GALERÍA DE ARCHIVOS ---
    const [fileRows, setFileRows] = useState([]);
    const [saving, setSaving] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const sessionBlobs = useRef({});

    // --- 4. EFECTOS GLOBALES ---
    useEffect(() => {
        if (masterTypifications.length > 0) fetchTypificationsByTypeElement(structureType === 'POST' ? 8 : 9);
    }, [structureType, masterTypifications]);

    useEffect(() => {
        if (pendingSedId && sedsDelAlimentador && sedsDelAlimentador.length > 0) {
            const sedEncontrada = sedsDelAlimentador.find(s =>
                String(s.sedInterno) === String(pendingSedId) ||
                String(s.value) === String(pendingSedId) ||
                String(s.id) === String(pendingSedId)
            );
            if (sedEncontrada) {
                setSelectedSed(sedEncontrada);
                setPendingSedId(null);
            }
        }
    }, [sedsDelAlimentador, pendingSedId]);

    // 🔥 MAPEO DE ARCHIVOS DE LA BD A LA TABLA INTERNA 🔥
    useEffect(() => {
        if (dbFiles && dbFiles.length > 0) {
            const mappedFiles = dbFiles
                .filter(f => f.archActivo === true)
                .map((f) => {
                    const safeHistoricalData = historicalData || [];
                    const parentDef = safeHistoricalData.find(d => d.defiInterno === f.archCodTabla);
                    const tipiActual = parentDef ? parentDef.tipiInterno : 0;
                    const idElementoRecuperado = parentDef ? parentDef.defiIdElemento : (f.archIdElemento || f.IdElemento || 0);

                    return {
                        tempId: `db-${f.archInterno}`,
                        isDatabase: true,
                        archInterno: f.archInterno,
                        archIdElemento: idElementoRecuperado,
                        originalName: f.archNombre,
                        currentPath: f.archNombre,
                        selectedDeficiencyId: f.archCodTabla, 
                        archTipo: parseInt(f.archTipo !== null ? f.archTipo : 1), 
                        archFecha: new Date(f.archFecha),
                        archLatitud: f.archLatitud !== null ? f.archLatitud : 0,
                        archLongitud: f.archLongitud !== null ? f.archLongitud : 0,
                        tipiInterno: tipiActual,
                    };
                });
            setFileRows(mappedFiles);
        } else {
            setFileRows([]);
        }
    }, [dbFiles, historicalData]);

    // --- 5. LÓGICA DE BÚSQUEDA GIS ---
    const { suggestions, searchNode, searchExactCode } = usePosteVanoSearch(fetchPostesChunk, fetchVanosChunk);

    const handleGisSelection = (e) => {
        const item = e.value;
        if (!item) return;

        setStructureCode(item.codigo);
        setStructureType(item._tipo); 
        setStructureIdInt(item.postInterno || item.vanoInterno || item.id || 0);

        if (item.lat) setGlobalLat(item.lat.toString());
        if (item.lng) setGlobalLon(item.lng.toString());

        const itemAlimId = item.alimInterno || item.alimentadorId;
        const itemSedId = item.postSubestacion || item.vanoSubestacion || item.sedId;

        if (itemAlimId) {
            setSelectedFeederId(itemAlimId);
            setSelectedSed(null);
            if (itemSedId) setPendingSedId(itemSedId);
        }
    };

    const searchSeds = (event) => {
        const query = event.query.toLowerCase();
        if (sedsDelAlimentador) {
            setFilteredSeds(sedsDelAlimentador.filter(sed =>
                (sed.label || "").toLowerCase().includes(query) || (sed.sedCodigo || "").toLowerCase().includes(query)
            ));
        }
    };

    const handleSearchDeficiencies = async () => {
        const rawCode = typeof structureCode === 'object' ? structureCode.codigo : structureCode;
        if (!rawCode) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un código GIS' });
            return;
        }

        const sedId = selectedSed ? (selectedSed.sedInterno || selectedSed.id || selectedSed.value) : null;
        const validElement = await searchExactCode(rawCode, null, selectedFeederId, sedId);

        if (!validElement) {
             toast.current.show({ severity: 'error', summary: 'No Encontrado', detail: `El elemento no existe en el Alimentador/SED seleccionados.` });
             setHistoricalData([]); setSelectedDeficiency(null); setGlobalLat(''); setGlobalLon('');
             return;
        }

        const realType = validElement._tipo === 'POSTE' ? 'POST' : 'VANO';
        if (realType !== structureType) {
            setStructureType(realType);
            toast.current.show({ severity: 'info', summary: 'Ajustado', detail: `Tipo corregido a ${realType}.` });
        }

        const elLat = validElement.postLatitud || validElement.vanoLatitudIni || validElement.latitud || validElement.lat;
        const elLon = validElement.postLongitud || validElement.vanoLongitudIni || validElement.longitud || validElement.lng;
        if (elLat) setGlobalLat(elLat.toString());
        if (elLon) setGlobalLon(elLon.toString());

        const data = await fetchByGis(rawCode);
        const activeData = (data || []).filter(d => {
            const isActivo = d.defiActivo !== 0 && d.defiActivo !== false;
            const matchTipo = String(d.defiTipoElemento).toUpperCase().includes(realType);
            return isActivo && matchTipo;
        });

        setHistoricalData(activeData);

        if (activeData.length > 0) {
            setSelectedDeficiency(activeData[0]);
            loadFiles(activeData[0].defiInterno);
            toast.current.show({ severity: 'success', summary: 'Historial', detail: `${activeData.length} registros activos` });
        } else {
            setSelectedDeficiency(null);
            toast.current.show({ severity: 'info', summary: 'Sin historial', detail: `Elemento verificado, sin deficiencias previas.` });
        }
    };

    // --- 6. LÓGICA DE APLICACIÓN DE CAMBIOS MASIVOS A LAS FOTOS ---
    const applyPathUpdates = () => {
        const isPathUpdate = !!selectedFeederId; 
        if (isPathUpdate && !selectedSed) {
            toast.current.show({ severity: 'warn', summary: 'Falta SED', detail: 'Para cambiar la ruta, el campo SED es obligatorio.' });
            return;
        }

        const isDateUpdate = !!globalDate;
        const isGeoUpdate = (globalLat && String(globalLat).trim() !== '') || (globalLon && String(globalLon).trim() !== '');
        const isTipiUpdate = !!globalTipificacion;

        if (!isPathUpdate && !isDateUpdate && !isGeoUpdate && !isTipiUpdate) {
            toast.current.show({ severity: 'info', summary: 'Sin Cambios', detail: 'Ingrese datos globales para aplicar.' });
            return;
        }

        const feederObj = feeders.find(f => f.value === selectedFeederId);
        const newFeeder = isPathUpdate ? resolveFeederName(feederObj) : null;
        
        let rawSed = selectedSed ? (selectedSed.sedCodigo || selectedSed.label || selectedSed.codigo || "SIN_SED") : "SIN_SED";
        if (typeof rawSed === 'string' && rawSed.includes(" - ")) rawSed = rawSed.split(" - ")[0];
        const newSed = isPathUpdate ? safeSeg(rawSed) : null;

        const newType = isPathUpdate ? (structureType === 'VANO' ? 'VANO' : 'POSTE') : null;
        const newCode = isPathUpdate ? safeSeg(structureCode || "SIN_CODIGO") : null;

        let globalUtm = { northing: 0, easting: 0 };
        if (isGeoUpdate) globalUtm = latLonToUTM(parseFloat(globalLat), parseFloat(globalLon));

        const updatedRows = fileRows.map(row => {
            const isAudio = parseInt(row.archTipo) === 0;
            const finalDate = isDateUpdate ? new Date(globalDate) : row.archFecha;
            const finalLat = isAudio ? 0 : (isGeoUpdate ? globalUtm.northing : row.archLatitud);
            const finalLon = isAudio ? 0 : (isGeoUpdate ? globalUtm.easting : row.archLongitud);

            let currentPathParts = row.currentPath.split('/');
            let newPath = row.currentPath; 

            if (currentPathParts.length >= 5 && currentPathParts[0].includes("SIGRE.MOVIL")) {
                const effectiveFeeder = isPathUpdate ? newFeeder : currentPathParts[1];
                const effectiveSed = isPathUpdate ? newSed : currentPathParts[2];
                const effectiveType = isPathUpdate ? newType : currentPathParts[3];
                const effectiveCode = isPathUpdate ? newCode : currentPathParts[4];

                let fileName = currentPathParts[currentPathParts.length - 1];
                
                if (fileName.startsWith("FOT-") || fileName.startsWith("AUD-")) {
                    const filePrefix = isAudio ? "AUD" : "FOT";
                    const fileExt = isAudio ? "m4a" : "jpg";

                    const getCorrelativo = (defId) => {
                        const defs7004 = (historicalData || []).filter(d => {
                            const code = d.tipiCodigo || getCodeById(d.tipiInterno) || "";
                            return String(code).trim() === "7004" || String(d.tipiInterno) === "60";
                        });
                        defs7004.sort((a, b) => a.defiInterno - b.defiInterno);
                        const idx = defs7004.findIndex(d => d.defiInterno === defId);
                        return idx !== -1 ? idx + 1 : (defs7004.length > 0 ? defs7004.length + 1 : 1);
                    };

                    const targetDef = historicalData.find(d => d.defiInterno === row.selectedDeficiencyId);
                    const originalTipi = targetDef ? getCodeById(targetDef.tipiInterno) : "0000";
                    const tipiCodeStr = isTipiUpdate ? String(getCodeById(globalTipificacion) || "0000").trim() : String(originalTipi).trim();

                    let folderPart = ""; let fileTipiPart = "";

                    if (tipiCodeStr === "7004") {
                        const correlativo = getCorrelativo(row.selectedDeficiencyId);
                        folderPart = `7004/${correlativo}`; 
                        fileTipiPart = `7004_${correlativo}`;
                    } else if (tipiCodeStr === "0000" || tipiCodeStr === "0" || tipiCodeStr === "") {
                        folderPart = "0000"; fileTipiPart = "0000";
                    } else {
                        folderPart = safeSeg(tipiCodeStr); fileTipiPart = safeSeg(tipiCodeStr);
                    }

                    const compactDate = formatCompactDate(finalDate);
                    const newFileName = `${filePrefix}-${effectiveSed}-${effectiveCode}-${fileTipiPart}-${compactDate}-${row.archTipo}.${fileExt}`;
                    newPath = `SIGRE.MOVIL/${effectiveFeeder}/${effectiveSed}/${effectiveType}/${effectiveCode}/${folderPart}/${newFileName}`;
                }
            }

            return { ...row, currentPath: newPath, archFecha: finalDate, archLatitud: finalLat, archLongitud: finalLon };
        });

        setFileRows(updatedRows);

        const changes = [];
        if (isPathUpdate) changes.push("Rutas base");
        if (isDateUpdate) changes.push("Fecha");
        if (isGeoUpdate) changes.push("Ubicación (UTM)");
        if (isTipiUpdate) changes.push("Tipificación");
        toast.current.show({ severity: 'success', summary: 'Actualizado', detail: `Aplicado: ${changes.join(', ')}.` });
    };

    const handleSaveAll = async () => {
        const elementId = selectedDeficiency ? selectedDeficiency.defiIdElemento : structureIdInt;
        if (fileRows.length === 0) return;
        setSaving(true);

        let successCount = 0; let failCount = 0;
        const updatedRows = [...fileRows];

        const promises = updatedRows.map(async (row, index) => {
            const payload = {
                archTabla: "Deficiencias", archInterno: row.archInterno, archCodTabla: row.selectedDeficiencyId, 
                archTipo: String(row.archTipo), archIdElemento: row.archIdElemento || elementId,
                archFecha: toLocalISOString(row.archFecha), archLatitud: parseFloat(String(row.archLatitud).replace(',', '.')) || 0, 
                archLongitud: parseFloat(String(row.archLongitud).replace(',', '.')) || 0, 
                archNombre: row.currentPath, tipiInterno: row.tipiInterno
            };
            const success = await addFile(payload);
            if (success) { 
                successCount++; 
                updatedRows[index] = { ...row, originalName: row.currentPath }; 
            } else {
                failCount++;
            }
        });

        await Promise.all(promises);
        setFileRows(updatedRows);
        setSaving(false);

        if (failCount === 0) {
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: `${successCount} archivos actualizados en BD.` });
        } else {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: `Guardados: ${successCount}. Errores: ${failCount}` });
        }
    };

    const handleRemoveRequest = (event, row) => {
        confirmPopup({
            target: event.currentTarget,
            message: '¿Eliminar archivo permanentemente?',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                let success = false;
                if (row.archInterno && row.archInterno > 0) {
                    success = await deleteFile(row.archInterno);
                } else success = true;

                if (success) {
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Archivo eliminado.' });
                    setFileRows(prev => prev.filter(r => r.tempId !== row.tempId));
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar de la BD.' });
                }
            }
        });
    };

    // --- 7. UTILIDADES DE IMAGEN ---
    const getCandidateUrls = (row) => {
        if (!row.originalName) return [];
        let base = row.originalName.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/^.*ELIMINADOS\//i, '').replace(/\/0000\//g, '/SINDEF/').replace(/^\/+/, '');
        
        const candidates = new Set();
        const parts = base.split('/');
        const originalFileName = parts.pop();
        const rootPathWithoutFile = parts.length > 0 ? parts.join('/') + '/' : '';
        
        let shortFileName = null;
        const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
        if (typeMatch) shortFileName = `${typeMatch[1]}.${typeMatch[2]}`;

        const addPathVariations = (folderPath) => {
            if (!folderPath) return;
            const formatUrl = (pathStr) => `${API_BASE_URL}/${pathStr.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
            candidates.add(formatUrl(folderPath + originalFileName));
            if (shortFileName) candidates.add(formatUrl(folderPath + shortFileName));
        };

        const fileDef = historicalData?.find(d => d.defiInterno === row.selectedDeficiencyId);
        let dbCode = String((fileDef ? getCodeById(fileDef.tipiInterno) : "0000") || "0000").trim();
        if (dbCode === "0000" || dbCode === "0") dbCode = "SINDEF";

        const processDeficiencyFolder = (currentPath) => {
            addPathVariations(currentPath);
            const complexRegex = new RegExp(`\/(${dbCode})\\.(\\d+)\\.([a-zA-Z0-9]+)\/`);
            const matchComplex = currentPath.match(complexRegex);
            
            if (matchComplex) { 
                const fullStr = matchComplex[0]; 
                addPathVariations(currentPath.replace(fullStr, `/${dbCode}/`)); 
                for(let i=1; i<=20; i++) addPathVariations(currentPath.replace(fullStr, `/${dbCode}/${i}/`)); 
            } else { 
                const simpleDefRegex = new RegExp(`\/${dbCode}\/`); 
                if (currentPath.match(simpleDefRegex)) { 
                    for(let i=1; i<=20; i++) { 
                        if (!currentPath.includes(`/${dbCode}/${i}/`)) { 
                            const split = currentPath.split(`/${dbCode}/`); 
                            if (split.length > 1) addPathVariations(`${split[0]}/${dbCode}/${i}/${split[1]}`); 
                        } 
                    } 
                } 
            }
        };

        processDeficiencyFolder(rootPathWithoutFile.replace(/\/(?:Vano|Poste)\//gi, '/')); 
        processDeficiencyFolder(rootPathWithoutFile);
        processDeficiencyFolder(rootPathWithoutFile.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/'));

        return Array.from(candidates);
    };

    const updateFileField = (tempId, field, value) => {
        setFileRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
    };

    // --- 8. TEMPLATES PARA TABLAS Y GALERÍA ---
    const itemTemplate = (item) => {
        const esPoste = item._tipo === 'POSTE' || item._tipo === 'POST';
        return (
            <div className={`flex flex-col border-b border-gray-100 p-2 ${esPoste ? 'hover:bg-blue-50' : 'hover:bg-green-50'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-700">{item.codigo}</span>
                    <Tag value={item._tipo} severity={esPoste ? 'info' : 'success'} className="text-[10px]" />
                </div>
                <span className="text-[10px] text-gray-400">{item.label}</span>
            </div>
        );
    };

    const FallbackImage = ({ row }) => {
        const isAudio = parseInt(row.archTipo) === 0;
        const urls = getCandidateUrls(row);
        const [srcIndex, setSrcIndex] = useState(0);
        const originalFileName = (row.originalName || "").split(/[/\\]/).pop();
        
        if (sessionBlobs && sessionBlobs.current[originalFileName]) {
            return <Image src={URL.createObjectURL(sessionBlobs.current[originalFileName])} alt="Foto" preview className="absolute inset-0 w-full h-full block" imageClassName="w-full h-full object-cover block" />;
        } 

        if (isAudio) return <i className="pi pi-volume-up text-4xl text-gray-400"></i>;

        return (
            <Image src={urls[srcIndex]} alt="Foto" preview className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100" imageClassName="w-full h-full object-cover block"
                onError={(e) => {
                    if (srcIndex < urls.length - 1) setSrcIndex(srcIndex + 1);
                    else { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100?text=Sin+Foto'; }
                }}
            />
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-700">
            <Toast ref={toast} />
            <ConfirmPopup />
            <ConfirmDialog />

            {/* 💡 A. CONFIGURACIÓN Y BÚSQUEDA UNIFICADA */}
            <Card className="border-t-4 border-indigo-500 shadow-sm mb-4">
                <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center">
                    <i className="pi pi-search mr-2"></i>Búsqueda y Configuración Global de Elemento
                </h4>
                
                <div className="flex flex-wrap gap-4 items-end mb-4">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase">Alimentador *</label>
                        <Dropdown value={selectedFeederId} onChange={(e) => { setSelectedFeederId(e.value); setSelectedSed(null); setFilteredSeds([]); }} options={feeders} optionLabel="label" optionValue="value" filter placeholder="Seleccione..." className="w-56 p-inputtext-sm border-blue-200" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase">SED *</label>
                        <AutoComplete value={selectedSed} suggestions={filteredSeds} completeMethod={searchSeds} field="label" dropdown onChange={(e) => setSelectedSed(e.value)} placeholder="Buscar SED..." className="w-56 p-inputtext-sm font-bold border-blue-200" disabled={!selectedFeederId} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase">Filtro Tipo</label>
                        <Dropdown value={structureType} options={[{ label: 'POSTE', value: 'POST' }, { label: 'VANO', value: 'VANO' }]} onChange={(e) => setStructureType(e.value)} className="w-32 p-inputtext-sm font-bold text-indigo-900 bg-indigo-50" />
                    </div>

                    <div className="flex flex-col flex-1 min-w-[250px]">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Código GIS (Autocompletar o Enter)</label>
                        <div className="p-inputgroup relative">
                            <AutoComplete
                                value={structureCode} suggestions={suggestions}
                                completeMethod={(e) => {
                                    const extractedSedId = selectedSed ? (selectedSed.sedInterno || selectedSed.id || selectedSed.value) : null;
                                    searchNode(e.query, selectedFeederId, extractedSedId);
                                }}
                                field="codigo" itemTemplate={itemTemplate} onSelect={handleGisSelection}
                                onChange={(e) => {
                                    const texto = typeof e.value === 'string' ? e.value.toUpperCase() : (e.value?.codigo || '');
                                    setStructureCode(texto);
                                    if (texto.includes('VBT') || texto.includes('VANO')) setStructureType('VANO');
                                    else if (texto.includes('PTO') || texto.includes('POST')) setStructureType('POST');
                                }}
                                placeholder="Escriba para buscar..." className="w-full" inputClassName="w-full p-inputtext-sm font-bold text-blue-900 uppercase" dropdown={false} delay={500} disabled={!selectedFeederId || !selectedSed} 
                            />
                            <Button icon={searchLoading ? "pi pi-spin pi-spinner" : "pi pi-check-circle"} onClick={handleSearchDeficiencies} loading={searchLoading} disabled={!selectedFeederId || !selectedSed || !structureCode} severity="info" tooltip="Verificar Elemento y Buscar Historial" />
                        </div>
                        {(!selectedFeederId || !selectedSed) && <small className="text-orange-500 font-bold mt-1 text-[10px]">Seleccione Alimentador y SED primero.</small>}
                    </div>
                </div>

                {/* Atributos Globales Extra */}
                <div className="flex flex-wrap gap-4 items-end pt-3 border-t border-indigo-100 bg-slate-50/50 p-2 rounded">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Tipificación Default</label>
                        <InputText value={globalTipificacion ? (getCodeById(globalTipificacion) || globalTipificacion) : ''} placeholder="Tipificación..." className="w-36 p-inputtext-sm font-bold text-indigo-700" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Fecha Global</label>
                        <Calendar value={globalDate} onChange={(e) => setGlobalDate(e.value)} showTime showSeconds placeholder="Original..." className="w-48 p-inputtext-sm" showIcon />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Latitud (GPS)</label>
                        <InputText value={globalLat} onChange={(e) => setGlobalLat(e.target.value)} placeholder="-16.35..." className="w-36 p-inputtext-sm" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Longitud (GPS)</label>
                        <InputText value={globalLon} onChange={(e) => setGlobalLon(e.target.value)} placeholder="-71.54..." className="w-36 p-inputtext-sm" />
                    </div>
                </div>
            </Card>

            {/* 💡 B. HISTORIAL ENCONTRADO */}
            {historicalData.length > 0 && (
                <div className="card border-l-4 border-blue-500 shadow-md bg-white rounded-lg mb-4">
                    <div className="p-3 bg-blue-50 flex justify-between items-center border-b border-blue-100">
                        <h3 className="font-bold text-blue-800 m-0 text-sm">Historial Encontrado ({structureType === 'POST' ? 'Postes' : 'Vanos'})</h3>
                        <Tag value={`${historicalData.length} Reg.`} severity="info" rounded />
                    </div>
                    <DataTable
                        value={historicalData} size="small" stripedRows rows={5} paginator selectionMode="single" selection={selectedDeficiency}
                        onSelectionChange={(e) => {
                            const def = e.value;
                            setSelectedDeficiency(def);
                            if (def) {
                                loadFiles(def.defiInterno);
                                if (def.defiFecRegistro) setGlobalDate(new Date(def.defiFecRegistro));
                                if (def.tipiInterno) setGlobalTipificacion(def.tipiInterno);
                            }
                        }}
                        dataKey="defiInterno" className="text-sm"
                    >
                        <Column field="defiInterno" header="ID" style={{ width: '70px' }} />
                        <Column field="defiCodigoElemento" header="Cód. GIS" />
                        <Column field="defiFecRegistro" header="Fecha" body={(r) => r.defiFecRegistro ? new Date(r.defiFecRegistro).toLocaleDateString() : '-'} />
                        <Column header="Tipificacion" body={(r) => <span className="font-bold text-gray-700 text-xs">{getCodeById(r.tipiInterno) || "Sin Def"}</span>} />
                        <Column field="defiObservacion" header="Obs" className="truncate" style={{ maxWidth: '150px' }} />
                    </DataTable>
                </div>
            )}

            {/* 💡 C. GESTIÓN DE ARCHIVOS INTEGRADA */}
            <Card title="Editor de Evidencias y Metadatos" className="mt-4 shadow-sm border-t-4 border-green-500">
                <div className="mb-3">
                    <Message severity="info" className="w-full justify-content-start border-none bg-blue-50 text-blue-800"
                        content={(
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-info-circle" style={{ fontSize: '1.2rem' }}></i>
                                <span className="text-xs">
                                    <strong>Instrucciones:</strong> Configura la tipificación, fecha o GPS arriba y usa "Aplicar Cambios" para actualizar en masa las fotos de abajo.
                                </span>
                            </div>
                        )}
                    />
                </div>
                
                <Toolbar className="mb-4 p-2 border-none bg-transparent"
                    left={
                        <div className="flex gap-2">
                            <Button label="Aplicar Cambios (De Arriba hacia Abajo)" icon="pi pi-arrow-down" severity="info" outlined onClick={applyPathUpdates} tooltip="Aplica Alim/SED y/o Metadatos globales a la tabla" />
                            <Button label={saving ? "Guardando..." : "Guardar en BD"} icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"} severity="success" onClick={handleSaveAll} disabled={fileRows.length === 0 || saving} />
                        </div>
                    }
                />

                <div className="flex flex-col gap-6">
                    {/* GALERÍA */}
                    <div>
                        <h5 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1"><i className="pi pi-images mr-2"></i>Vista de Evidencias</h5>
                        <div className="flex-1 overflow-y-auto p-3 bg-gray-100/50 rounded-md border border-gray-200 mt-2">
                            <div className="flex flex-wrap gap-3 content-start">
                                <div onClick={() => setShowPhotoModal(true)} className="h-28 w-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 group transition-all bg-white shadow-sm">
                                    <i className="pi pi-camera text-3xl text-gray-400 group-hover:text-blue-500 mb-1 transition-colors"></i>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-blue-600">Añadir Foto</span>
                                </div>
                                {fileRows.map((row) => (
                                    <div key={row.tempId} className="h-28 w-28 rounded-lg border border-gray-200 overflow-hidden relative group hover:shadow-md transition-shadow bg-white flex flex-col">
                                        <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
                                            <FallbackImage row={row} />
                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveRequest(e, row); }} className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded border border-white flex items-center justify-center shadow-md transition-all z-10" title="Eliminar archivo">
                                                <i className="pi pi-trash text-[10px] font-bold"></i>
                                            </button>
                                        </div>
                                        <div className="h-6 w-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center uppercase tracking-tighter shrink-0 z-10 relative">
                                            {photoTypes[row.archTipo] || `Tipo ${row.archTipo}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TABLA DE DETALLES */}
                    <div>
                        <h5 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1"><i className="pi pi-list mr-2"></i>Detalle de Metadatos</h5>
                        <DataTable value={fileRows} size="small" emptyMessage="No hay archivos asociados." loading={loadingFiles} stripedRows showGridlines className="text-sm">
                            <Column header="Id" body={(r) => <span className="text-xs">{r.archInterno}</span>} style={{ width: '60px' }} />
                            <Column header="DefiInterno" body={(r) => <span className="text-xs font-bold text-slate-700">{r.selectedDeficiencyId}</span>} style={{ minWidth: '100px' }} />
                            <Column header="Tipificacion" body={(r) => { const def = historicalData.find(d => d.defiInterno === r.selectedDeficiencyId); return <span className="text-xs font-bold text-slate-700">{def ? getCodeById(def.tipiInterno) : r.selectedDeficiencyId}</span>; }} style={{ minWidth: '120px' }} />
                            <Column header="Tipo" body={(r) => <span className="text-xs font-medium text-gray-600">{photoTypes[r.archTipo] || `Tipo ${r.archTipo}`} ({r.archTipo})</span>} style={{ width: '120px' }} />
                            <Column header="Fecha" body={(r) => <Calendar value={r.archFecha} onChange={(e) => updateFileField(r.tempId, 'archFecha', e.value)} showTime showSeconds className="w-full" inputClassName="text-xs p-1" appendTo="self" />} style={{ width: '170px' }} />
                            <Column header="Lat" body={(r) => <InputText value={r.archLatitud} onChange={(e) => updateFileField(r.tempId, 'archLatitud', e.target.value)} className="w-full text-xs p-1" />} style={{ width: '110px' }} />
                            <Column header="Long" body={(r) => <InputText value={r.archLongitud} onChange={(e) => updateFileField(r.tempId, 'archLongitud', e.target.value)} className="w-full text-xs p-1" />} style={{ width: '110px' }} />
                            <Column header="Nombre (Ruta)" body={(r) => {
                                const isModified = r.originalName !== r.currentPath;
                                return (
                                    <div className="flex flex-col" style={{maxWidth:'450px'}}>
                                        <code className={`text-[10px] p-1 border rounded break-all font-mono leading-tight ${isModified ? 'bg-yellow-50 border-yellow-300 text-yellow-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                                            {r.currentPath}
                                        </code>
                                        {isModified && <span className="text-[9px] text-orange-600 font-bold mt-1"><i className="pi pi-pencil mr-1"></i>Cambio pendiente</span>}
                                    </div>
                                );
                            }} />
                            <Column body={(r) => <Button icon="pi pi-trash" rounded text severity="danger" onClick={(e) => handleRemoveRequest(e, r)} />} style={{ width: '50px' }} />
                        </DataTable>
                    </div>
                </div>
            </Card>

            {/* MODAL PARA SUBIR NUEVA FOTO */}
            {showPhotoModal && (
                <PhotoUploadModal
                    visible={showPhotoModal}
                    onHide={() => setShowPhotoModal(false)}
                    initialData={{ tipo: 1, lat: globalLat, long: globalLon, date: globalDate || new Date(), file: null, preview: null }}
                    contextData={{ feeder: feeders.find(f => f.value === selectedFeederId), sed: selectedSed, elementType: structureType, elementCode: structureCode, elementId: selectedDeficiency ? selectedDeficiency.defiIdElemento : structureIdInt }}
                    onSave={async (data) => {/* ... misma lógica de guardado directo al backend ... */}} 
                    deficiencyData={selectedDeficiency}
                    currentPhotos={dbFiles}
                />
            )}
        </div>
    );
}