import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import JSZip from 'jszip'; // 🔥 REGRESA EL ZIP
import api from '../../api/apiConfig';
import DeficiencyPdfDocument from './DeficiencyPdfDocument';
import { useTramosMap } from '../../hooks/useTramosMap';
const API_BASE_URL = "http://localhost:8080/"; 

const PdfGeneratorModal = ({ visible, onHide, dataToPrint, empresaInfo, allData }) => {
    const [step, setStep] = useState(0); 
    const [progress, setProgress] = useState({ current: 0, total: 0, detail: '' });
    
    const [missingPhotosLog, setMissingPhotosLog] = useState([]);
    const [showMissingModal, setShowMissingModal] = useState(false);
    const [zipBlob, setZipBlob] = useState(null); // 🔥 ESTADO PARA EL ZIP
    
    const isCancelled = useRef(false);
    
    useEffect(() => {
        if (visible) {
            setStep(0);
            setProgress({ current: 0, total: dataToPrint?.length || 0, detail: 'Iniciando...' });
            setMissingPhotosLog([]);
            setShowMissingModal(false);
            setZipBlob(null);
            isCancelled.current = false;
        }
    }, [visible, dataToPrint]);

    const generateCandidates = (rawPath, defCode, currentSupply, my7004Correlativo) => {
        if (!rawPath) return [];
        let base = rawPath.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/^.*ELIMINADOS\//i, '').replace(/\/0000\//g, '/SINDEF/');
        const candidates = [];
        const parts = base.split('/');
        const originalFileName = parts.pop();
        const rootPathWithoutFile = parts.join('/') + '/';
        let shortFileName = null;
        
        const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
        if (typeMatch) shortFileName = `${typeMatch[1]}.${typeMatch[2]}`;

        const addPathVariations = (folderPath) => { 
            candidates.push(folderPath + originalFileName); 
            if (shortFileName) candidates.push(folderPath + shortFileName); 
        };

        const processDeficiencyFolder = (currentPath) => {
            const complexRegex = new RegExp(`\/(${defCode})\\.(\\d+)\\.([a-zA-Z0-9]+)\/`);
            const matchComplex = currentPath.match(complexRegex);
            addPathVariations(currentPath);
            if (currentSupply && currentSupply !== '0') {
                 if (matchComplex) { 
                     const fullStr = matchComplex[0]; 
                     addPathVariations(currentPath.replace(fullStr, `/${defCode}.1.${currentSupply}/`)); 
                     addPathVariations(currentPath.replace(fullStr, `/${defCode}/${currentSupply}/`)); 
                 } else { 
                     const simpleDefRegex = new RegExp(`\/${defCode}\/`); 
                     if (currentPath.match(simpleDefRegex)) { 
                         addPathVariations(currentPath.replace(simpleDefRegex, `/${defCode}.1.${currentSupply}/`)); 
                         addPathVariations(currentPath.replace(simpleDefRegex, `/${defCode}/${currentSupply}/`)); 
                     } 
                 }
            }
            if (matchComplex) { 
                const fullStr = matchComplex[0]; 
                addPathVariations(currentPath.replace(fullStr, `/${defCode}/`)); 
                for(let i=1; i<=5; i++) addPathVariations(currentPath.replace(fullStr, `/${defCode}/${i}/`)); 
            } else { 
                const simpleDefRegex = new RegExp(`\/${defCode}\/`); 
                if (currentPath.match(simpleDefRegex)) { 
                    for(let i=1; i<=5; i++) { 
                        if (!currentPath.includes(`/${defCode}/${i}/`)) { 
                            const split = currentPath.split(`/${defCode}/`); 
                            if (split.length > 1) addPathVariations(`${split[0]}/${defCode}/${i}/${split[1]}`); 
                        } 
                    } 
                } 
            }
        };

        processDeficiencyFolder(rootPathWithoutFile);
        const pathUpper = rootPathWithoutFile.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/');
        if (pathUpper !== rootPathWithoutFile) processDeficiencyFolder(pathUpper);

        if ((defCode === "7004" || defCode === "60") && my7004Correlativo > 0) {
            const specific7004Path = rootPathWithoutFile.replace(/\/7004\//i, `/7004/${my7004Correlativo}/`);
            candidates.unshift(specific7004Path + originalFileName);
        }

        return candidates.map(c => `${API_BASE_URL}/${(c.startsWith('/') ? c.substring(1) : c).split('/').map(encodeURIComponent).join('/')}`);
    };

    const getWorkingImageUrl = async (candidates) => {
        if (!candidates || candidates.length === 0) return null;
        for (const url of candidates) {
            try {
                const resp = await fetch(url, { method: 'GET', headers: { "ngrok-skip-browser-warning": "true" } });
                if (resp.ok) {
                    const blob = await resp.blob();
                    if (blob.size > 0 && blob.type.startsWith('image/')) return URL.createObjectURL(blob);
                }
            } catch (error) {
                const isValid = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = url;
                });
                if (isValid) return url;
            }
        }
        return null;
    };

    const calculate7004Correlativo = (def) => {
        const targetGis = def.defiCodigoElemento;
        const sameElement7004s = (allData || []).filter(d => d.defiCodigoElemento === targetGis && (String(d.tipiCodigo || d.tipificacionLabel || "").includes("7004") || String(d.tipiInterno) === "60"));
        sameElement7004s.sort((a, b) => a.defiInterno - b.defiInterno);
        const myIndex = sameElement7004s.findIndex(d => d.defiInterno === def.defiInterno) + 1;
        return myIndex > 0 ? myIndex : 1;
    };
const { fetchTramosDictionary } = useTramosMap();
    const startProcessing = async () => {
        if (!dataToPrint || dataToPrint.length === 0) return;
        setStep(1);
        
        let totalProcessed = 0;
        const currentMissingLog = [];
        let resolvedData = [];
        const tempUrls = []; 

        // 🔥 3. NUEVA SINCRONIZACIÓN ULTRA RÁPIDA CON EL HOOK
        setProgress(p => ({ ...p, detail: `Sincronizando Tramos y Circuitos...` }));
        
        // Llamamos al hook y esperamos el diccionario listo
        const tramosMap = await fetchTramosDictionary(empresaInfo?.sedId);

        // 2. PROCESAMIENTO ÚNICO DE TODAS LAS DEFICIENCIAS
        for (let i = 0; i < dataToPrint.length; i++) {
            if (isCancelled.current) break;
            
            const def = dataToPrint[i];
            const defCode = String(def.tipificacionLabel || "0000").split(' ')[0].trim();
            const currentSupply = String(def.defiNumSuministro || "0").trim();
            const my7004Corr = (defCode === "7004" || def.tipiInterno === 60) ? calculate7004Correlativo(def) : 0;
            
            try {
                const response = await api.get('/File/GetByDeficiencyWeb', { params: { x_deficiency: def.defiInterno } });
                const files = (response.data || []).filter(f => f.archActivo === 1 || f.archActivo === true);
                
                const photoPromises = [1, 2, 3, 4].map(async (typeId) => {
                    const fileData = files.find(x => parseInt(x.archTipo) === typeId);
                    if (!fileData) return { typeId, url: null };
                    
                    const candidates = generateCandidates(fileData.archNombre || fileData.ARCH_Nombre, defCode, currentSupply, my7004Corr);
                    const url = await getWorkingImageUrl(candidates);
                    return { typeId, url };
                });

                const results = await Promise.all(photoPromises);
                
                const fotos = {};
                const missing = []; 

                results.forEach(res => {
                    const key = res.typeId === 1 ? 'panoramica' : res.typeId === 2 ? 'frontal' : res.typeId === 3 ? 'detalle' : 'evidencia';
                    fotos[key] = res.url;
                    
                    if (res.url) {
                        if (res.url.startsWith('blob:')) tempUrls.push(res.url);
                    } else {
                        missing.push(key.toUpperCase()); 
                    }
                });

                if (missing.length > 0) {
                    currentMissingLog.push({ gis: def.defiCodigoElemento, tipi: defCode, faltantes: missing.join(', ') });
                }

                // 🔥 4. NUEVA ASIGNACIÓN DE VARIABLES DE ORDENAMIENTO
                const tipoDefNormalizado = def.defiTipoElemento.toUpperCase().startsWith('POST') ? 'POSTE' : 'VANO';
                const keyBusqueda = `${tipoDefNormalizado}_${def.defiIdElemento}`;
                
                const tramoInfo = tramosMap[keyBusqueda] || {};
                
                const defConTramo = { 
                    ...def, 
                    tramOrdenCalculado: tramoInfo.orden || 0,
                    tramCodigoCalculado: tramoInfo.circuito || '', 
                    circuitoCalculado: tramoInfo.circuito || ''
                };

                resolvedData.push({ deficiencia: defConTramo, fotos });

            } catch (e) { 
                resolvedData.push({ deficiencia: { ...def, tramOrdenCalculado: 0, tramCodigoCalculado: '', circuitoCalculado: '' }, fotos: {} }); 
                currentMissingLog.push({ gis: def.defiCodigoElemento, tipi: defCode, faltantes: 'TODAS (Error BD)' });
            }

            totalProcessed++;
            setProgress({ current: totalProcessed, total: dataToPrint.length, detail: `Procesando fotos: ${totalProcessed}/${dataToPrint.length}` });
        }

        if (isCancelled.current) return;

        // 🔥 5. MOTOR DE ORDENAMIENTO ACTUALIZADO
// 🔥 MOTOR DE ORDENAMIENTO: Primero CIRCUITO, luego SECUENCIA
        setProgress(p => ({ ...p, detail: `Ordenando registros por Circuito y Secuencia...` }));
        
        resolvedData.sort((a, b) => {
            // 1. ORDENAMOS POR CIRCUITO (tramCodigoCalculado)
            const circuitoA = String(a.deficiencia.tramCodigoCalculado || '').toUpperCase();
            const circuitoB = String(b.deficiencia.tramCodigoCalculado || '').toUpperCase();
            
            if (circuitoA !== circuitoB) {
                // El { numeric: true } asegura que "Cir.2" vaya ANTES que "Cir.10"
                return circuitoA.localeCompare(circuitoB, undefined, { numeric: true, sensitivity: 'base' });
            }

            // 2. SI ES EL MISMO CIRCUITO, ORDENAMOS POR SECUENCIA (tramOrdenCalculado)
            const seqA = Number(a.deficiencia.tramOrdenCalculado || 0);
            const seqB = Number(b.deficiencia.tramOrdenCalculado || 0);
            
            return seqA - seqB;
        });


        // 🔥🔥🔥 ESTO ES LO QUE FALTABA: GENERACIÓN DEL PDF Y EL ZIP 🔥🔥🔥
        if (resolvedData.length > 0) {
            setProgress(p => ({ ...p, detail: `Ensamblando y comprimiendo PDF...` }));
            try {
                const zip = new JSZip(); // Instanciamos ZIP
                const docElement = <DeficiencyPdfDocument dataList={resolvedData} empresaInfo={empresaInfo} />;
                const pdfInstance = pdf();
                pdfInstance.updateContainer(docElement);
                const blob = await pdfInstance.toBlob();
                
                // Metemos el PDF al ZIP
                zip.file(`Reporte_SEAL_SED_${empresaInfo?.sed || 'SED'}_Completo.pdf`, blob);
                
                // Generamos el .zip final
                const finalZip = await zip.generateAsync({ type: "blob" });
                setZipBlob(finalZip);
                
                // Limpieza masiva de RAM al final
                tempUrls.forEach(u => URL.revokeObjectURL(u));
            } catch (err) {
                console.error(`Error generando el PDF unificado:`, err);
            }
        }

        setMissingPhotosLog(currentMissingLog);
        setStep(2);
    }; // 🔥 FIN DE LA FUNCIÓN STARTPROCESSING

    const cancelProcess = () => {
        isCancelled.current = true;
        onHide();
    };

    return (
        <>
            <Dialog header="Generador Masivo (ZIP Ordenado)" visible={visible} onHide={cancelProcess} style={{ width: '420px' }} closable={step === 0 || step === 2} modal>
                <div className="flex flex-col items-center py-4 gap-4 text-center">
                    {step === 0 && (
                        <>
                            <i className="pi pi-file-pdf text-5xl text-red-500"></i>
                            <span className="font-bold">Se procesarán {progress.total} registros</span>
                            <p className="text-xs text-gray-500 px-4">Se ordenarán por Circuito y Tramo, y se entregará un único PDF dentro de un archivo ZIP.</p>
                            <Button label="Iniciar Generación" icon="pi pi-play" onClick={startProcessing} className="w-full mt-2" />
                        </>
                    )}
                    
                    {step === 1 && (
                        <div className="w-full flex flex-col items-center gap-3">
                            <i className="pi pi-cloud-download text-4xl text-blue-500"></i>
                            <span className="text-sm font-bold text-blue-800">{progress.detail}</span>
                            <ProgressBar value={Math.round((progress.current / progress.total) * 100)} className="w-full h-3" />
                            <Button label="Cancelar Proceso" icon="pi pi-times" severity="danger" outlined size="small" onClick={cancelProcess} className="mt-2" />
                        </div>
                    )}
                    
                    {step === 2 && (
                        <>
                            <i className="pi pi-check-circle text-5xl text-green-500"></i>
                            <span className="font-bold text-lg">¡Proceso Finalizado!</span>
                            <p className="text-sm text-gray-600">El reporte ordenado ha sido comprimido. Descárgalo a continuación.</p>
                            
                            {/* 🔥 BOTÓN DEL QA DE FOTOS FALTANTES */}
                            {missingPhotosLog.length > 0 && (
                                <div className="w-full mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                                    <p className="text-xs text-orange-800 font-bold mb-2">
                                        Se detectaron {missingPhotosLog.length} deficiencias con fotos incompletas.
                                    </p>
                                    <Button 
                                        label="Ver Reporte de Faltantes" 
                                        icon="pi pi-exclamation-triangle" 
                                        severity="warning" 
                                        onClick={() => setShowMissingModal(true)} 
                                        className="w-full p-button-sm" 
                                    />
                                </div>
                            )}

                            {/* 🔥 BOTÓN PARA DESCARGAR EL ZIP */}
                            <Button 
                                label="Descargar Archivo ZIP" 
                                icon="pi pi-download" 
                                severity="success" 
                                onClick={() => saveAs(zipBlob, `Reporte_SEAL_${empresaInfo?.sed}.zip`)} 
                                className="w-full h-12 mt-2" 
                                disabled={!zipBlob}
                            />
                        </>
                    )}
                </div>
            </Dialog>

            <Dialog header="Auditoría: Fotos Faltantes o No Encontradas" visible={showMissingModal} onHide={() => setShowMissingModal(false)} style={{ width: '600px' }} modal>
                <div className="p-2">
                    <p className="text-sm text-gray-600 mb-3">La siguiente tabla muestra los códigos GIS cuyas fotografías no se encontraron en el servidor.</p>
                    <DataTable value={missingPhotosLog} paginator rows={10} size="small" stripedRows className="border text-sm">
                        <Column field="gis" header="Cód. GIS / Nodo" style={{ fontWeight: 'bold' }} />
                        <Column field="tipi" header="Tipi." style={{ width: '80px', textAlign: 'center' }} />
                        <Column field="faltantes" header="Fotos Ausentes" style={{ color: '#dc2626' }} />
                    </DataTable>
                </div>
            </Dialog>
        </>
    );
};

export default PdfGeneratorModal;