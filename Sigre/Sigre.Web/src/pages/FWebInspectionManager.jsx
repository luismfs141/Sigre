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
import { Dialog } from 'primereact/dialog';
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
import { Checkbox } from 'primereact/checkbox';
import { API_BASE_URL } from '../utils/ngrok';
import ResilientImage from '../utils/ResilientImage';

const highContrastStyle = `
  .p-datatable .p-datatable-tbody > tr.p-highlight {
      background-color: #bfdbfe !important; /* Azul más fuerte */
      color: #1e3a8a !important; /* Texto azul oscuro */
      font-weight: bold;
      border-left: 6px solid #2563eb; /* Borde lateral */
  }
  .p-datatable .p-datatable-tbody > tr.p-highlight .p-tag {
      border: 1px solid #1e3a8a; 
  }
  .p-datatable-wrapper {
      cursor: default;
  }
`;
// --- DICCIONARIOS Y AYUDANTES ---
const photoTypes = { 1: 'Panorámica', 2: 'Frontal', 3: 'Izquierda', 4: 'Derecha', 5: 'Medidor', 6: 'Adicional', 0: 'Otro' };

const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

function formatCompactDate(date) {
    if (!date) return "00000000-000000";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "00000000-000000";
    const pad = (n) => String(n).padStart(2, '0');
    const padMs = (n) => n.toString().padStart(3, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${padMs(d.getMilliseconds())}`;
}

const toLocalISOString = (date) => {
    if (!date) return null;
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
};

function resolveFeederName(feederVal, feedersArray) {
    if (!feederVal) return "SIN_ALIMENTADOR";
    let raw = "SIN_ALIMENTADOR";
    if (typeof feederVal === 'object') {
        raw = feederVal.label || "SIN_ALIMENTADOR";
    } else {
        const found = (feedersArray || []).find(f => String(f.value) === String(feederVal));
        if (found) raw = found.label || "SIN_ALIMENTADOR";
        else raw = String(feederVal);
    }
    raw = raw.replace(/[0-9]/g, '').replace(/-/g, '').trim();
    return safeSeg(raw);
}

function resolveSedLabel(sedVal, sedsArray) {
    if (!sedVal) return "SIN_SED";
    let raw = "SIN_SED";

    if (typeof sedVal === 'object') {
        raw = sedVal.sedCodigo || sedVal.label || sedVal.codigo || "SIN_SED";
    } else {
        const found = (sedsArray || []).find(s =>
            String(s.sedInterno) === String(sedVal) ||
            String(s.value) === String(sedVal) ||
            String(s.id) === String(sedVal)
        );
        if (found) raw = found.sedCodigo || found.label || found.codigo || "SIN_SED";
        else raw = String(sedVal);
    }

    if (typeof raw === 'string' && raw.includes(" - ")) raw = raw.split(" - ")[0];
    return safeSeg(raw);
}



function detectSinDefFolderAliasFromPath(path) {
    const normalized = String(path || '').replace(/\\/g, '/');
    const match = normalized.match(/\/(SINDEF|0000)(?=\/|$)/i);
    return match ? match[1].toUpperCase() : "SINDEF";
}

function normalizeSinDefFolderOnly(path, targetAlias = "SINDEF") {
    return String(path || '')
        .replace(/\\/g, '/')
        .replace(/\/(SINDEF|0000)(?=\/|$)/i, `/${targetAlias}`);
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
    // --- ESTADOS PARA ACTUALIZACIÓN MASIVA ---
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [bulkNewGis, setBulkNewGis] = useState('');
    const [bulkOptions, setBulkOptions] = useState({
        path: false, // Alimentador, SED, Código, Tipo
        gisCode: false,
        date: false, // Fecha Global
        tipi: false, // Tipificación
        geo: false   // GPS (Protegido)
    });
    // --- 2. ESTADOS DE DATOS E HISTORIAL ---
    const { files: dbFiles, loadFiles, deleteFile, addFile, loadingFiles, moveFilePhysical } = useFiles();
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
    const pendingSinDefNormalizationRef = useRef(null);

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
            const activeFiles = dbFiles.filter(f => f.archActivo === true);

            const targetDefId = pendingSinDefNormalizationRef.current;

            const hasTargetDef = targetDefId
                ? activeFiles.some(f => Number(f.archCodTabla) === Number(targetDefId))
                : false;

            const hasSinDefFolder = activeFiles.some(f =>
                /\/SINDEF(?=\/|$)/i.test(String(f.archNombre || '').replace(/\\/g, '/'))
            );

            const has0000Folder = activeFiles.some(f =>
                /\/0000(?=\/|$)/i.test(String(f.archNombre || '').replace(/\\/g, '/'))
            );

            // 🔥 SOLO normalizamos si:
            // 1) venimos de agregar una foto nueva S/D
            // 2) el lote actual quedó mezclado entre 0000 y SINDEF
            const shouldForceSinDefFolder = !!targetDefId && hasTargetDef && hasSinDefFolder && has0000Folder;

            const mappedFiles = activeFiles.map((f) => {
                const safeHistoricalData = historicalData || [];
                const parentDef = safeHistoricalData.find(d => d.defiInterno === f.archCodTabla);
                const tipiActual = parentDef ? parentDef.tipiInterno : 0;
                const idElementoRecuperado = parentDef ? parentDef.defiIdElemento : (f.archIdElemento || f.IdElemento || 0);

                const currentPath = shouldForceSinDefFolder
                    ? normalizeSinDefFolderOnly(f.archNombre, "SINDEF")
                    : f.archNombre;

                return {
                    tempId: `db-${f.archInterno}`,
                    isDatabase: true,
                    archInterno: f.archInterno,
                    archIdElemento: idElementoRecuperado,
                    originalName: f.archNombre,
                    currentPath,
                    selectedDeficiencyId: f.archCodTabla,
                    archTipo: parseInt(f.archTipo !== null ? f.archTipo : 1),
                    archFecha: new Date(f.archFecha),
                    archLatitud: f.archLatitud !== null ? f.archLatitud : 0,
                    archLongitud: f.archLongitud !== null ? f.archLongitud : 0,
                    tipiInterno: tipiActual,
                };
            });

            setFileRows(mappedFiles);

            // 🔥 Limpiamos la marca solo después de procesar la carga originada por la nueva foto
            if (hasTargetDef) {
                pendingSinDefNormalizationRef.current = null;
            }
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
        setGlobalTipificacion('');
        setGlobalDate('');

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
        setStructureIdInt(validElement.postInterno || validElement.vanoInterno || validElement.id || 0);

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
            const isActivo = d.defiActivo === 1 || d.defiActivo === true || d.defiActivo === '1' || d.defiActivo === 'true';
            const matchTipo = String(d.defiTipoElemento).toUpperCase().includes(realType);
            return isActivo && matchTipo;
        });

        setHistoricalData(activeData);

        if (activeData.length > 0) {
            setSelectedDeficiency(null);
            loadFiles(activeData[0].defiInterno);
            toast.current.show({ severity: 'success', summary: 'Historial', detail: `${activeData.length} registros activos` });
        } else {
            setSelectedDeficiency(null);
            toast.current.show({ severity: 'info', summary: 'Sin historial', detail: `Elemento verificado, sin deficiencias previas.` });
        }
    };
    // ==============================================================================
    // 🔥 6. LÓGICA DE GUARDADO DESDE EL MODAL (LA QUE NO ENCONTRABAS) 🔥
    // ==============================================================================
    const handlePhotoSave = async (dataToSave) => {
        try {
            // A. Contexto
            const feederLbl = resolveFeederName(selectedFeederId, feeders);
            const sedLbl = resolveSedLabel(selectedSed, sedsDelAlimentador);

            const codeElemLbl = safeSeg(structureCode);
            const folderTipoElem = structureType === 'VANO' ? 'VANO' : 'POSTE';
            const dbTipoElem = structureType === 'VANO' ? 'VANO' : 'POST';

            // B. Deficiencia y Carpeta
            const defId = selectedDeficiency ? selectedDeficiency.defiInterno : 0;
            const defTipiInterno = selectedDeficiency ? selectedDeficiency.tipiInterno : 0;
            const defCodeBase = String(selectedDeficiency?.tipiCodigo || getCodeById(defTipiInterno) || "0000").trim();
            const isSinDef = defCodeBase === "0000" || defCodeBase === "0" || defCodeBase.toUpperCase() === "SINDEF";

            let defFolder = defCodeBase === "7004" ? "7004/1" : (isSinDef ? "SINDEF" : defCodeBase);
            let namePart = isSinDef ? "SINDEF" : defCodeBase;

            // Manejo especial correlativos 7004
            if (defCodeBase === "7004") {
                const defs7004 = historicalData.filter(d => {
                    const c = d.tipiCodigo || getCodeById(d.tipiInterno) || "";
                    return String(c).trim() === "7004" || String(d.tipiInterno) === "60";
                });
                defs7004.sort((a, b) => a.defiInterno - b.defiInterno);
                const index = defs7004.findIndex(d => d.defiInterno === defId);
                const folderNum = index !== -1 ? index + 1 : (defs7004.length + 1);
                defFolder = `7004/${folderNum}`;
                namePart = `7004_${folderNum}`;
            }

            // C. Archivo y UTM
            const compactDate = formatCompactDate(dataToSave.date || new Date());
            const fileName = `FOT-${sedLbl}-${codeElemLbl}-${namePart}-${compactDate}-${dataToSave.tipo}.jpg`;
            const dbPath = `SIGRE.MOVIL/${feederLbl}/${sedLbl}/${folderTipoElem}/${codeElemLbl}/${defFolder}/${fileName}`;

            const utm = latLonToUTM(parseFloat(dataToSave.lat), parseFloat(dataToSave.long));

            // D. Registro de Blobs para ZIP sin recargar
            if (dataToSave.file) { sessionBlobs.current[fileName] = dataToSave.file; }
            const safeElementId = selectedDeficiency ? selectedDeficiency.defiIdElemento : structureIdInt;
            const payload = {
                archTabla: "Deficiencias", archInterno: 0, archTipo: String(dataToSave.tipo),
                archNombre: dbPath, archCodTabla: Number(defId),
                archLatitud: utm.northing, archLongitud: utm.easting,
                archFecha: new Date(dataToSave.date || new Date()).toISOString(),
                archTipoElemento: dbTipoElem, archIdElemento: Number(structureIdInt),
                archIdElemento: Number(safeElementId),
                tipiInterno: Number(defTipiInterno), archActivo: true,
                file: dataToSave.file
            };

            const result = await addFile(payload);
            if (result) {
                toast.current.show({ severity: 'success', summary: 'OK', detail: 'Foto guardada' });
                setShowPhotoModal(false);

                // 🔥 SOLO si acabo de agregar una foto nueva a una deficiencia S/D,
                // marcamos esta carga para uniformizar carpeta 0000 -> SINDEF
                // sin tocar el nombre del archivo.
                if (isSinDef && defId) {
                    pendingSinDefNormalizationRef.current = Number(defId);
                }

                if (defId) loadFiles(defId);
            }

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar la foto.' });
        }
    };

    // --- 6. LÓGICA DE APLICACIÓN DE CAMBIOS MASIVOS A LAS FOTOS ---
    // --- LÓGICA DE ACTUALIZACIÓN MASIVA SELECTIVA ---

    const openBulkUpdateModal = () => {
        if (fileRows.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Vacío', detail: 'No hay evidencias en la tabla.' });
            return;
        }

        // Pre-marcamos inteligentemente las opciones si el usuario llenó los campos arriba
        // 🚨 EL GPS SIEMPRE ESTARÁ EN FALSE POR SEGURIDAD 🚨
        setBulkNewGis('');
setBulkOptions({
            path: false, 
            date: false, 
            tipi: false, 
            geo: false,
            gisCode: false
        });

        setShowBulkUpdateModal(true);
    };

    const executeBulkUpdate = () => {
        const { path: applyPath, date: applyDate, geo: applyGeo, tipi: applyTipi, gisCode: applyGisCode } = bulkOptions;

        if (applyPath && (!selectedFeederId || !selectedSed)) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falta Alimentador o SED para actualizar la ruta.' });
            return;
        }

        const newFeeder = applyPath ? resolveFeederName(selectedFeederId, feeders) : null;
        let rawSed = selectedSed ? (selectedSed.sedCodigo || selectedSed.label || selectedSed.codigo || "SIN_SED") : "SIN_SED";
        if (typeof rawSed === 'string' && rawSed.includes(" - ")) rawSed = rawSed.split(" - ")[0];
        const newSed = applyPath ? safeSeg(rawSed) : null;

        let newType = applyPath ? String(structureType).toUpperCase() : null;
        if (newType && newType.includes('VANO')) newType = 'VANO';
        else if (newType && newType.includes('POST')) newType = 'POSTE';

        const newCode = applyPath ? safeSeg(typeof structureCode === 'object' ? structureCode.codigo : structureCode || "SIN_CODIGO") : null;
        const currentGlobalCode = typeof structureCode === 'object' ? structureCode.codigo : structureCode;
        const cleanNewGis = applyGisCode ? safeSeg(currentGlobalCode) : null;

        let globalUtm = { northing: 0, easting: 0 };
        if (applyGeo && globalLat && globalLon) {
            globalUtm = latLonToUTM(parseFloat(globalLat), parseFloat(globalLon));
        }

        const updatedRows = fileRows.map(row => {
            const isAudio = parseInt(row.archTipo) === 0;

            const finalDate = (applyDate && globalDate) ? new Date(globalDate) : row.archFecha;
            const finalLat = isAudio ? 0 : ((applyGeo && globalLat) ? globalUtm.northing : row.archLatitud);
            const finalLon = isAudio ? 0 : ((applyGeo && globalLon) ? globalUtm.easting : row.archLongitud);

            let newPath = row.currentPath;
            const currentPathParts = String(row.currentPath || '').split('/');

            if ((applyPath || applyTipi || applyGisCode || applyDate) && currentPathParts.length >= 5 && currentPathParts[0].includes("SIGRE.MOVIL")) {
                const effectiveFeeder = applyPath ? newFeeder : currentPathParts[1];
                const effectiveSed = applyPath ? newSed : currentPathParts[2];
                const effectiveType = applyPath ? newType : String(currentPathParts[3]).toUpperCase();
                const effectiveCode = applyGisCode ? cleanNewGis : (applyPath ? newCode : currentPathParts[4]);

                let fileName = currentPathParts[currentPathParts.length - 1];

                if (fileName.startsWith("FOT-") || fileName.startsWith("AUD-")) {
                    const filePrefix = isAudio ? "AUD" : "FOT";
                    const fileExt = isAudio ? "m4a" : "jpg";

                    const targetDef = historicalData.find(d => d.defiInterno === row.selectedDeficiencyId);
                    const originalTipi = targetDef ? getCodeById(targetDef.tipiInterno) : "0000";
                    const tipiCodeStr = applyTipi
                        ? String(getCodeById(globalTipificacion) || "0000").trim()
                        : String(originalTipi).trim();

                    let folderPart = "";
                    let fileTipiPart = "";

                    if (tipiCodeStr === "7004") {
                        const defs7004 = historicalData.filter(d =>
                            String(d.tipiCodigo || getCodeById(d.tipiInterno)).trim() === "7004" ||
                            String(d.tipiInterno) === "60"
                        );

                        defs7004.sort((a, b) => a.defiInterno - b.defiInterno);
                        const idx = defs7004.findIndex(d => d.defiInterno === row.selectedDeficiencyId);
                        const correlativo = idx !== -1 ? idx + 1 : 1;

                        folderPart = `7004/${correlativo}`;
                        fileTipiPart = `7004_${correlativo}`;
                    } else if (tipiCodeStr === "0000" || tipiCodeStr === "0" || tipiCodeStr === "") {
                        // 🔥 REGLA:
                        // Si el usuario marcó "Tipificación" en Aplicar Globales y la nueva tipificación es S/D,
                        // entonces uniformizamos la carpeta a SINDEF.
                        // Si NO marcó Tipificación, se respeta el alias existente (0000 o SINDEF).
                        folderPart =  "SINDEF";
                        fileTipiPart = "SINDEF";
                    } else {
                        folderPart = safeSeg(tipiCodeStr);
                        fileTipiPart = safeSeg(tipiCodeStr);
                    }

                    const compactDate = formatCompactDate(finalDate);
                    const newFileName = `${filePrefix}-${effectiveSed}-${effectiveCode}-${fileTipiPart}-${compactDate}-${row.archTipo}.${fileExt}`;
                    newPath = `SIGRE.MOVIL/${effectiveFeeder}/${effectiveSed}/${effectiveType}/${effectiveCode}/${folderPart}/${newFileName}`;
                }
            }

            return {
                ...row,
                currentPath: newPath,
                archFecha: finalDate,
                archLatitud: finalLat,
                archLongitud: finalLon
            };
        });

        setFileRows(updatedRows);
        setShowBulkUpdateModal(false);
        toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Datos aplicados a la tabla de evidencias.' });
    };



    // ==============================================================================
    // 🔥 8. LÓGICA DE GUARDADO EN BD Y DESCARGA ZIP REPARADA 🔥
    // ==============================================================================
    // ==============================================================================
    // 🔥 8. LÓGICA DE DESCARGA ZIP (REPARADA USANDO ENDPOINT SEGURO) 🔥
    // ==============================================================================

    // Función auxiliar para fallbacks físicos si el endpoint de API falla
    // const getCandidateUrls = (row) => {
    //     if (!row.originalName) return [];
    //     let base = row.originalName.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/^.*ELIMINADOS\//i, '').replace(/\/0000\//g, '/SINDEF/');
    //     base = base.replace(/^\/+/, '');

    //     const candidates = new Set();
    //     const parts = base.split('/');
    //     const originalFileName = parts.pop();
    //     const rootPathWithoutFile = parts.length > 0 ? parts.join('/') + '/' : '';

    //     let shortFileName = null;
    //     const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
    //     if (typeMatch) shortFileName = `${typeMatch[1]}.${typeMatch[2]}`;

    //     const addPathVariations = (folderPath) => {
    //         if (!folderPath) return;
    //         const baseUrl = API_BASE_URL.replace(/\/+$/, '');
    //         const formatUrl = (pathStr) => `${baseUrl}/${pathStr.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
    //         candidates.add(formatUrl(folderPath + originalFileName));
    //         if (shortFileName) candidates.add(formatUrl(folderPath + shortFileName));
    //     };

    //     // Obtenemos el dbCode original para no depender de la ruta si ya se sobreescribió
    //     const fileDef = historicalData?.find(d => d.defiInterno === row.selectedDeficiencyId);
    //     let dbCode = String((fileDef ? getCodeById(fileDef.tipiInterno) : "0000") || "0000").trim();
    //     if (dbCode === "0000" || dbCode === "0") dbCode = "SINDEF";
    //     const currentSupply = fileDef?.defiNumSuministro || '0';

    //     const processDeficiencyFolder = (currentPath) => {
    //         const complexRegex = new RegExp(`\/(${dbCode})\\.(\\d+)\\.([a-zA-Z0-9]+)\/`);
    //         const matchComplex = currentPath.match(complexRegex);
    //         addPathVariations(currentPath);

    //         if (currentSupply && currentSupply !== '0') {
    //             if (matchComplex) {
    //                 const fullStr = matchComplex[0];
    //                 addPathVariations(currentPath.replace(fullStr, `/${dbCode}.1.${currentSupply}/`));
    //                 addPathVariations(currentPath.replace(fullStr, `/${dbCode}/${currentSupply}/`));
    //             } else {
    //                 const simpleDefRegex = new RegExp(`\/${dbCode}\/`);
    //                 if (currentPath.match(simpleDefRegex)) {
    //                     addPathVariations(currentPath.replace(simpleDefRegex, `/${dbCode}.1.${currentSupply}/`));
    //                     addPathVariations(currentPath.replace(simpleDefRegex, `/${dbCode}/${currentSupply}/`));
    //                 }
    //             }
    //         }
    //         if (matchComplex) {
    //             const fullStr = matchComplex[0];
    //             addPathVariations(currentPath.replace(fullStr, `/${dbCode}/`));
    //             for(let i=1; i<=20; i++) addPathVariations(currentPath.replace(fullStr, `/${dbCode}/${i}/`));
    //         } else {
    //             const simpleDefRegex = new RegExp(`\/${dbCode}\/`);
    //             if (currentPath.match(simpleDefRegex)) {
    //                 for(let i=1; i<=20; i++) {
    //                     if (!currentPath.includes(`/${dbCode}/${i}/`)) {
    //                         const split = currentPath.split(`/${dbCode}/`);
    //                         if (split.length > 1) addPathVariations(`${split[0]}/${dbCode}/${i}/${split[1]}`);
    //                     }
    //                 }
    //             }
    //         }
    //     };

    //     const pathNoType = rootPathWithoutFile.replace(/\/(?:Vano|Poste)\//gi, '/');
    //     processDeficiencyFolder(pathNoType);
    //     processDeficiencyFolder(rootPathWithoutFile);
    //     const pathUpper = rootPathWithoutFile.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/');
    //     if (pathUpper !== rootPathWithoutFile) processDeficiencyFolder(pathUpper);

    //     const match7004 = rootPathWithoutFile.match(/\/(7004)\.(\d+)\.([a-zA-Z0-9]+)\//);
    //     if (match7004 && dbCode !== "7004") {
    //         const tempDbCode = dbCode; dbCode = "7004";
    //         processDeficiencyFolder(rootPathWithoutFile);
    //         dbCode = tempDbCode;
    //     }

    //     return Array.from(candidates);
    // };

    const getCandidateUrls = (row) => {
        if (!row.originalName) return [];

        let base = row.originalName
            .replace(/\\/g, '/')
            .replace(/^.*SIGRE\.MOVIL\//i, '')
            .replace(/^.*ELIMINADOS\//i, '');

        const candidates = new Set();
        const parts = base.split('/');
        const originalFileName = parts.pop();

        if (!originalFileName) return [];

        const rootPathWithoutFile = parts.length > 0 ? `${parts.join('/')}/` : '';
        let shortFileName = null;

        const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
        if (typeMatch) {
            shortFileName = `${typeMatch[1]}.${typeMatch[2]}`;
        }

        const escapeRegExp = (text) =>
            String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const buildFolderAliasVariants = (folderPath) => {
            const variants = new Set([folderPath]);

            if (/\/SINDEF\//i.test(folderPath)) {
                variants.add(folderPath.replace(/\/SINDEF\//gi, '/0000/'));
            }

            if (/\/0000\//i.test(folderPath)) {
                variants.add(folderPath.replace(/\/0000\//gi, '/SINDEF/'));
            }

            return Array.from(variants);
        };

        const addPathVariations = (folderPath) => {
            if (!folderPath) return;

            for (const variantPath of buildFolderAliasVariants(folderPath)) {
                const baseUrl = API_BASE_URL.replace(/\/+$/, '');
                const formatUrl = (pathStr) =>
                    `${baseUrl}/${pathStr.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;

                candidates.add(formatUrl(`${variantPath}${originalFileName}`));

                if (shortFileName) {
                    candidates.add(formatUrl(`${variantPath}${shortFileName}`));
                }
            }
        };

        const fileDef = historicalData?.find((d) => d.defiInterno === row.selectedDeficiencyId);

        const rawDbCode = String((fileDef ? getCodeById(fileDef.tipiInterno) : '0000') || '0000')
            .trim()
            .toUpperCase();

        const defCodesToTry =
            rawDbCode === '0000' || rawDbCode === '0' || rawDbCode === 'SINDEF'
                ? ['SINDEF', '0000']
                : [rawDbCode];

        const currentSupply = fileDef?.defiNumSuministro || '0';

        const processDeficiencyFolder = (currentPath, codeVariants = defCodesToTry) => {
            for (const pathVariant of buildFolderAliasVariants(currentPath)) {
                addPathVariations(pathVariant);

                for (const currentCode of codeVariants) {
                    const escapedCode = escapeRegExp(currentCode);
                    const complexRegex = new RegExp(`\\/(${escapedCode})\\.(\\d+)\\.([a-zA-Z0-9]+)\\/`, 'i');
                    const matchComplex = pathVariant.match(complexRegex);

                    if (currentSupply && currentSupply !== '0') {
                        if (matchComplex) {
                            const fullStr = matchComplex[0];
                            addPathVariations(pathVariant.replace(fullStr, `/${currentCode}.1.${currentSupply}/`));
                            addPathVariations(pathVariant.replace(fullStr, `/${currentCode}/${currentSupply}/`));
                        } else {
                            const simpleDefRegex = new RegExp(`\\/${escapedCode}\\/`, 'i');
                            if (simpleDefRegex.test(pathVariant)) {
                                addPathVariations(pathVariant.replace(simpleDefRegex, `/${currentCode}.1.${currentSupply}/`));
                                addPathVariations(pathVariant.replace(simpleDefRegex, `/${currentCode}/${currentSupply}/`));
                            }
                        }
                    }

                    if (matchComplex) {
                        const fullStr = matchComplex[0];
                        addPathVariations(pathVariant.replace(fullStr, `/${currentCode}/`));

                        for (let i = 1; i <= 20; i++) {
                            addPathVariations(pathVariant.replace(fullStr, `/${currentCode}/${i}/`));
                        }
                    } else {
                        const simpleDefRegex = new RegExp(`\\/${escapedCode}\\/`, 'i');

                        if (simpleDefRegex.test(pathVariant)) {
                            for (let i = 1; i <= 20; i++) {
                                addPathVariations(pathVariant.replace(simpleDefRegex, `/${currentCode}/${i}/`));
                            }
                        }
                    }
                }
            }
        };

        const pathNoType = rootPathWithoutFile.replace(/\/(?:Vano|Poste)\//gi, '/');
        processDeficiencyFolder(pathNoType);
        processDeficiencyFolder(rootPathWithoutFile);

        const pathUpper = rootPathWithoutFile
            .replace(/\/Vano\//i, '/VANO/')
            .replace(/\/Poste\//i, '/POSTE/');

        if (pathUpper !== rootPathWithoutFile) {
            processDeficiencyFolder(pathUpper);
        }

        const match7004 = rootPathWithoutFile.match(/\/(7004)\.(\d+)\.([a-zA-Z0-9]+)\//);
        if (match7004 && !defCodesToTry.includes('7004')) {
            processDeficiencyFolder(rootPathWithoutFile, ['7004']);
        }

        return Array.from(candidates);
    };





    const handleDownloadRenamedZip = async () => {
        if (fileRows.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Vacío', detail: 'No hay archivos para descargar.' });
            return;
        }

        const rowsForZip = fileRows.filter(row => parseInt(row.archTipo) !== 0);

        if (rowsForZip.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Sin fotos', detail: 'No hay fotos para descargar en el ZIP.' });
            return;
        }

        setZipLoading(true);
        let filesAdded = 0;

        try {
            const zip = new JSZip();

            const downloadPromises = rowsForZip.map(async (row) => {
                let zipPath = row.currentPath.replace(/^.*?SIGRE\.MOVIL\//, '');
                const originalFileName = (row.originalName || "").split(/[/\\]/).pop();

                // 1. Verificar si es una foto subida recientemente (en la memoria RAM)
                if (sessionBlobs.current && sessionBlobs.current[originalFileName]) {
                    zip.file(zipPath, sessionBlobs.current[originalFileName]);
                    filesAdded++;
                    return true;
                }

                // 2. Método principal: endpoint oficial
                if (row.archInterno && row.archInterno > 0) {
                    const baseUrl = API_BASE_URL.replace(/\/+$/, '');
                    const apiUrl = `${baseUrl}/api/files/download/${row.archInterno}`;

                    try {
                        const response = await fetch(apiUrl);
                        const contentType = response.headers.get("content-type");

                        if (response.ok && contentType && !contentType.includes("text/html")) {
                            const blob = await response.blob();
                            zip.file(zipPath, blob);
                            filesAdded++;
                            return true;
                        }
                    } catch (e) {
                        console.warn(`Falló la API de descarga para ID ${row.archInterno}, intentando rutas físicas...`);
                    }
                }

                // 3. Fallback: URLs físicas
                const urlsToTry = getCandidateUrls(row);

                for (const url of urlsToTry) {
                    try {
                        const response = await fetch(url);
                        const contentType = response.headers.get("content-type");

                        if (response.ok && contentType && !contentType.includes("text/html")) {
                            const blob = await response.blob();
                            zip.file(zipPath, blob);
                            filesAdded++;
                            return true;
                        }
                    } catch (e) {
                        // sigue intentando
                    }
                }

                console.warn(`Fracaso total: No se encontró en servidor: ${row.originalName}`);
                return false;
            });

            await Promise.all(downloadPromises);

            if (filesAdded === 0) {
                toast.current.show({ severity: 'error', summary: 'ZIP Vacío', detail: 'El servidor no devolvió ninguna foto.' });
                return;
            }

            const content = await zip.generateAsync({ type: "blob" });
            const codeElemLbl = safeSeg(typeof structureCode === 'object' ? structureCode.codigo : structureCode);
            saveAs(content, `Evidencias_Renombradas_${codeElemLbl || "LOTE"}.zip`);

            toast.current.show({
                severity: 'success',
                summary: 'Descargado',
                detail: `Se empaquetaron ${filesAdded} de ${rowsForZip.length} fotos.`
            });

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo crítico al generar el ZIP.' });
        } finally {
            setZipLoading(false);
        }
    };

    // ==============================================================================
    // 🔥 9. GUARDADO TOTAL (DB + ZIP) 🔥
    // ==============================================================================
    // const handleSaveAll = async () => {
    //     const elementId = selectedDeficiency ? selectedDeficiency.defiIdElemento : structureIdInt;
    //     if (fileRows.length === 0) return;
    //     setSaving(true);

    //     // 1. Descargar las fotos físicas ANTES de que la BD pierda la pista
    //     toast.current.show({ severity: 'info', summary: 'Preparando', detail: 'Empaquetando fotos antes de guardar...' });
    //     await handleDownloadRenamedZip();

    //     // 2. Guardar en Base de Datos
    //     let successCount = 0; let failCount = 0;
    //     const updatedRows = [...fileRows];

    //     const promises = updatedRows.map(async (row, index) => {
    //         const payload = {
    //             archTabla: "Deficiencias", archInterno: row.archInterno, archCodTabla: row.selectedDeficiencyId,
    //             archTipo: String(row.archTipo), archIdElemento: row.archIdElemento || elementId,
    //             archFecha: toLocalISOString(row.archFecha), archLatitud: parseFloat(String(row.archLatitud).replace(',', '.')) || 0,
    //             archLongitud: parseFloat(String(row.archLongitud).replace(',', '.')) || 0,
    //             archNombre: row.currentPath, tipiInterno: row.tipiInterno
    //         };
    //         const success = await addFile(payload);
    //         if (success) {
    //             successCount++;
    //             updatedRows[index] = { ...row, originalName: row.currentPath }; // Al guardar con éxito, original pasa a ser el nuevo
    //         } else {
    //             failCount++;
    //         }
    //     });

    //     await Promise.all(promises);
    //     setFileRows(updatedRows);
    //     setSaving(false);

    //     if (failCount === 0) toast.current.show({ severity: 'success', summary: 'Guardado', detail: `${successCount} archivos actualizados en BD.` });
    //     else toast.current.show({ severity: 'warn', summary: 'Atención', detail: `Guardados: ${successCount}. Errores: ${failCount}` });
    // };

    // ==============================================================================
    // 🔥 9. GUARDADO TOTAL (ZIP + DB + MOVIMIENTO FÍSICO EN SERVIDOR) 🔥
    // ==============================================================================
    // No olvides importar API_URL arriba en tu archivo si no lo tienes:
    // import { API_URL } from '../utils/api'; // Ajusta la ruta según tu proyecto

    // ==============================================================================
    // 🔥 9. GUARDADO TOTAL (ZIP + DB + MOVIMIENTO FÍSICO OPCIONAL) 🔥
    // ==============================================================================
    const handleSaveAll = async () => {
        const elementId = selectedDeficiency ? selectedDeficiency.defiIdElemento : structureIdInt;
        if (fileRows.length === 0) return;
        setSaving(true);

        // 1. RESPALDO: Descargar las fotos físicas ANTES de moverlas en el servidor
        toast.current.show({ severity: 'info', summary: 'Preparando', detail: 'Empaquetando fotos de respaldo...' });
        await handleDownloadRenamedZip();

        // 2. MOVER Y GUARDAR EN BD
        toast.current.show({ severity: 'info', summary: 'Procesando', detail: 'Actualizando base de datos e intentando mover archivos...' });

        let successCount = 0;
        let failCount = 0;
        let physicalMoveFailed = false; // 🔥 Bandera clave para la degradación elegante
        const updatedRows = [...fileRows];

        const promises = updatedRows.map(async (row, index) => {
            const isModified = row.originalName && row.originalName !== row.currentPath;

            // A. Intento de movimiento físico en el disco (Solo si la ruta cambió y no es audio)
            if (isModified && parseInt(row.archTipo) !== 0) {
                // Usamos nuestro hook limpio. Retorna true si funcionó, false si falló.
                const successMove = await moveFilePhysical(row.originalName, row.currentPath);

                if (!successMove) {
                    physicalMoveFailed = true; // Encendemos la bandera para el mensaje "sticky"
                }
            }

            // B. Guardar en Base de Datos (🔥 SE EJECUTA SIEMPRE, haya fallado o no el paso físico)
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
                // Al guardar con éxito, la ruta actual pasa a ser la nueva original en la tabla web
                updatedRows[index] = { ...row, originalName: row.currentPath };
            } else {
                failCount++;
            }
        });

        await Promise.all(promises);
        setFileRows(updatedRows);
        setSaving(false);

        // C. Lógica de Mensajes Finales
        if (failCount === 0) {
            if (physicalMoveFailed) {
                // 🔥 MENSAJE DURADERO si la BD está bien pero el disco falló
                toast.current.show({
                    severity: 'warn',
                    summary: 'BD Actualizada - Faltan Mover Archivos Fisicos',
                    detail: 'Los datos se actualizaron en la BD y tienes el ZIP de respaldo. Sin embargo, no se pudieron mover las fotos en las carpetas del servidor (revisa la unidad D/H). Por favor, descomprime el ZIP y reemplázalas manualmente.',
                    sticky: true // El usuario debe cerrarlo manualmente
                });
            } else {
                // Todo perfecto (ZIP + BD + Disco físico)
                toast.current.show({ severity: 'success', summary: 'Éxito Total', detail: `${successCount} archivos respaldados, movidos físicamente y actualizados en BD.` });
            }
        } else {
            toast.current.show({ severity: 'error', summary: 'Error de BD', detail: `Se guardaron ${successCount} registros, pero fallaron ${failCount}.`, sticky: true });
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

    // const FallbackImage = ({ row }) => {
    //     const isAudio = parseInt(row.archTipo) === 0;
    //     const urls = getCandidateUrls(row);
    //     const [srcIndex, setSrcIndex] = useState(0);
    //     const originalFileName = (row.originalName || "").split(/[/\\]/).pop();

    //     if (sessionBlobs && sessionBlobs.current[originalFileName]) {
    //         return <Image src={URL.createObjectURL(sessionBlobs.current[originalFileName])} alt="Foto" preview className="absolute inset-0 w-full h-full block" imageClassName="w-full h-full object-cover block" />;
    //     }

    //     if (isAudio) return <i className="pi pi-volume-up text-4xl text-gray-400"></i>;

    //     return (
    //         <Image src={urls[srcIndex]} alt="Foto" preview className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100" imageClassName="w-full h-full object-cover block"
    //             onError={(e) => {
    //                 if (srcIndex < urls.length - 1) setSrcIndex(srcIndex + 1);
    //                 else { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100?text=Sin+Foto'; }
    //             }}
    //         />
    //     );
    // };
    // const FallbackImage = ({ row }) => {
    //     const isAudio = parseInt(row.archTipo) === 0;
    //     const [srcIndex, setSrcIndex] = useState(0);

    //     if (isAudio) {
    //         return <i className="pi pi-volume-up text-4xl text-gray-400"></i>;
    //     }

    //     // 🔥 CORRECCIÓN AQUÍ: Usar originalName para la vista previa porque 
    //     // el archivo físico sigue ahí hasta que le demos a Guardar en BD.
    //     const pathForPreview = (row.originalName && row.originalName !== row.currentPath)
    //         ? row.originalName
    //         : row.currentPath;

    //     const normalizedPath = String(pathForPreview || '')
    //         .replace(/\\/g, '/')
    //         .replace(/^.*SIGRE\.MOVIL\//i, '')
    //         .replace(/^\/+/, '');

    //     const buildUrl = (path) =>
    //         `${API_BASE_URL.replace(/\/+$/, '')}/${path
    //             .split('/')
    //             .map(encodeURIComponent)
    //             .join('/')}?t=${Date.now()}`;

    //     const srcs = [];

    //     if (normalizedPath) {
    //         srcs.push(buildUrl(normalizedPath));

    //         if (/\/SINDEF\//i.test(normalizedPath)) {
    //             srcs.push(buildUrl(normalizedPath.replace(/\/SINDEF\//gi, '/0000/')));
    //         } else if (/\/0000\//i.test(normalizedPath)) {
    //             srcs.push(buildUrl(normalizedPath.replace(/\/0000\//gi, '/SINDEF/')));
    //         }
    //     }

    //     return (
    //         <Image
    //             src={srcs[srcIndex] || ''}
    //             alt="Foto"
    //             preview
    //             className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100"
    //             imageClassName="w-full h-full object-cover block"
    //             onError={(e) => {
    //                 if (srcIndex < srcs.length - 1) {
    //                     setSrcIndex(srcIndex + 1);
    //                 } else {
    //                     e.target.onerror = null;
    //                     e.target.src = 'https://via.placeholder.com/100?text=Sin+Foto';
    //                 }
    //             }}
    //         />
    //     );
    // };

    return (

        <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-700">
            <style>{highContrastStyle}</style>
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
                        <label className="text-[10px] font-bold text-indigo-700 uppercase mb-1">
                            Código GIS
                        </label>

                        <div className="p-inputgroup relative">
                            <InputText
                                value={structureCode}
                                onChange={(e) => {
                                    const texto = e.target.value.toUpperCase();
                                    setStructureCode(texto);

                                    // Mantenemos tu lógica para setear el tipo de estructura
                                    if (texto.includes('VBT') || texto.includes('VANO')) {
                                        setStructureType('VANO');
                                    } else if (texto.includes('PTO') || texto.includes('POST')) {
                                        setStructureType('POST');
                                    }

                                    // Opcional pero recomendado: si el usuario vuelve a escribir, limpiamos el error
                                    // setIsGisNotFound(false); 
                                }}
                                placeholder="Escriba el código..."
                                className="w-full p-inputtext-sm font-bold text-blue-900 uppercase"
                                disabled={!selectedFeederId || !selectedSed}
                            />
                            <Button
                                icon={searchLoading ? "pi pi-spin pi-spinner" : "pi pi-check-circle"}
                                onClick={handleSearchDeficiencies}
                                loading={searchLoading}
                                disabled={!selectedFeederId || !selectedSed || !structureCode}
                                severity="info"
                                tooltip="Verificar Elemento y Buscar Historial"
                            />
                        </div>
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
                    <Toolbar className="mb-4 bg-transparent border-none p-0"
                        left={
                            <div className="flex gap-2">
                                {/* 🔥 ACTUALIZADO 🔥 */}
                                <Button label="Aplicar Globales" icon="pi pi-arrow-down" severity="info" outlined onClick={openBulkUpdateModal} />
                                <Button label={saving ? "Guardando..." : "Guardar en BD"} icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"} severity="success" onClick={handleSaveAll} disabled={fileRows.length === 0 || saving} />
                            </div>
                        }
                    />
                </div>



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
                                {fileRows.map((row, index) => {
    const isAudio = parseInt(row.archTipo) === 0;
    const typeLabel = photoTypes[row.archTipo] || `Tipo ${row.archTipo}`;

    // 1. MANTENEMOS TU DISEÑO PARA LOS AUDIOS
    if (isAudio) {
        return (
            <div key={row.tempId} className="h-28 w-28 rounded-lg border border-gray-200 overflow-hidden relative group hover:shadow-md transition-shadow bg-white flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
                    <i className="pi pi-volume-up text-4xl text-gray-400"></i>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveRequest(e, row); }} className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded border border-white flex items-center justify-center shadow-md transition-all z-10" title="Eliminar archivo">
                        <i className="pi pi-trash text-[10px] font-bold"></i>
                    </button>
                </div>
                <div className="h-6 w-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center uppercase tracking-tighter shrink-0 z-10 relative">
                    {typeLabel}
                </div>
            </div>
        );
    }

    // 2. BUSCAMOS LA TIPIFICACIÓN ORIGINAL PARA EL RESILIENT
    const parentDef = historicalData.find(d => d.defiInterno === row.selectedDeficiencyId);
    const defCodeStr = parentDef ? getCodeById(parentDef.tipiInterno) : null;

    // 3. REEMPLAZAMOS LA TARJETA DE IMAGEN POR NUESTRO COMPONENTE SENIOR
    return (
        <div key={row.tempId} className="h-28 w-28 shrink-0 flex items-center justify-center">
            <ResilientImage
                // 🔥 Adaptamos la fila (row) para que ResilientImage la lea correctamente
                file={{ ...row, archNombre: row.currentPath || row.originalName, archTipo: row.archTipo }}
                index={index}
                onImageClick={() => {}} // Vacío porque aquí no hay Lightbox
                onUrlResolved={() => {}} 
                typeName={typeLabel}
                currentSupply={null}
                defCode={defCodeStr}
                // Conectamos la eliminación a tu función existente
                onDelete={(fileToDelete) => handleRemoveRequest({ currentTarget: document.body }, fileToDelete)}
                onCropRequest={() => {}}
                onReplaceRequest={() => {}}
                allowDirectEdit={false} // 🔥 Apagamos los botones azul y verde para esta vista gerencial
                cacheBuster={Date.now()}
            />
        </div>
    );
})}
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
                                    <div className="flex flex-col" style={{ maxWidth: '450px' }}>
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
                    onSave={handlePhotoSave}
                    deficiencyData={selectedDeficiency}
                    currentPhotos={dbFiles}
                />
            )}


            {/* 🔥 MODAL DE ACTUALIZACIÓN MASIVA SELECTIVA 🔥 */}
            <Dialog
                header="¿Qué datos deseas sobrescribir?"
                visible={showBulkUpdateModal}
                style={{ width: '450px' }}
                modal
                onHide={() => setShowBulkUpdateModal(false)}
                footer={
                    <div className="flex justify-end gap-2 mt-4">
                        <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowBulkUpdateModal(false)} className="p-button-text p-button-secondary" />
                        <Button label="Aplicar a Todas" icon="pi pi-check" onClick={executeBulkUpdate} className="p-button-primary font-bold" disabled={!bulkOptions.path && !bulkOptions.date && !bulkOptions.tipi && !bulkOptions.geo && !bulkOptions.gisCode} />
                    </div>
                }
            >
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Selecciona qué configuraciones globales deseas aplicar a las <strong>{fileRows.length}</strong> fotos en la tabla.
                    <br /><span className="text-red-500 font-bold">Atención:</span> Esta acción sobrescribirá los datos actuales de las fotos.
                </p>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center">
                        <Checkbox inputId="cb_path" checked={bulkOptions.path} onChange={e => setBulkOptions({ ...bulkOptions, path: e.checked })} />
                        <label htmlFor="cb_path" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">Ubicación y Ruta</label>
                        <span className="ml-2 text-xs text-gray-500">(Alimentador, SED, Código GIS)</span>
                    </div>
                    {/* 🔥 NUEVO BLOQUE MEJORADO: Renombrar Código GIS (Usa el global) */}
                    <div className="flex flex-col bg-blue-50 p-3 rounded-md border border-blue-200 mt-2 mb-2">
                        <div className="flex items-center">
                            <Checkbox inputId="cb_gisCode" checked={bulkOptions.gisCode} onChange={e => setBulkOptions({ ...bulkOptions, gisCode: e.checked })} />
                            <label htmlFor="cb_gisCode" className="ml-2 text-sm font-bold text-blue-800 cursor-pointer">
                                Código GIS actual
                            </label>
                        </div>
                        {bulkOptions.gisCode && (
                            <div className="mt-2 ml-7">
                                <span className="text-xs font-bold text-blue-700 bg-white px-2 py-1 rounded border border-blue-300 shadow-sm">
                                    Nuevo Código: {typeof structureCode === 'object' ? structureCode.codigo : (structureCode || 'NINGUNO')}
                                </span>
                                <small className="text-[10px] text-gray-500 block mt-2 leading-tight">
                                    Se actualizará el nombre en la ruta de las fotos usando el código que está en la barra de búsqueda principal.
                                </small>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center">
                        <Checkbox inputId="cb_tipi" checked={bulkOptions.tipi} onChange={e => setBulkOptions({ ...bulkOptions, tipi: e.checked })} />
                        <label htmlFor="cb_tipi" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">Tipificación</label>
                        <span className="ml-2 text-xs text-gray-500">({getCodeById(globalTipificacion) || "Ninguna seleccionada"})</span>
                    </div>

                    <div className="flex items-center">
                        <Checkbox inputId="cb_date" checked={bulkOptions.date} onChange={e => setBulkOptions({ ...bulkOptions, date: e.checked })} />
                        <label htmlFor="cb_date" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">Fecha y Hora de Captura</label>
                    </div>

                    <div className="flex items-start bg-red-50 p-3 rounded-md border border-red-200 mt-2">
                        <Checkbox inputId="cb_geo" checked={bulkOptions.geo} onChange={e => setBulkOptions({ ...bulkOptions, geo: e.checked })} />
                        <div className="ml-2 flex flex-col">
                            <label htmlFor="cb_geo" className="text-sm font-extrabold text-red-700 cursor-pointer mb-1">
                                Coordenadas GPS (Peligro)
                            </label>
                            <span className="text-[11px] text-red-600 leading-tight">
                                Sobrescribirá la latitud y longitud individual de cada foto con el valor global superior. <strong>Úsalo solo si todas las fotos fueron tomadas exactamente en el mismo punto físico.</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>

    );
}