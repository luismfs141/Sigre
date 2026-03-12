import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import JSZip from 'jszip'; 
import api from '../../api/apiConfig';
import DeficiencyPdfDocument from './DeficiencyPdfDocument';
import { useTramosMap } from '../../hooks/useTramosMap';
//const API_BASE_URL="https://subobscure-hilda-audacious.ngrok-free.dev"; 
const API_BASE_URL = "http://localhost:8080/"; 

const PdfGeneratorModal = ({ visible, onHide, dataToPrint, empresaInfo, allData }) => {
    const [step, setStep] = useState(0); 
    const [progress, setProgress] = useState({ current: 0, total: 0, detail: '' });
    
    const [missingPhotosLog, setMissingPhotosLog] = useState([]);
    const [showMissingModal, setShowMissingModal] = useState(false);
    const [zipBlob, setZipBlob] = useState(null); 
    
    const isCancelled = useRef(false);
    const { fetchTramosDictionary } = useTramosMap();
    const filterOnlyActive = (list) => {
        return (list || []).filter(def => 
            def.defiActivo === 1 || 
            def.defiActivo === true || 
            String(def.defiActivo) === '1' || 
            String(def.defiActivo) === 'true'
        );
    };
    useEffect(() => {
        if (visible) {
            const activeData = filterOnlyActive(dataToPrint);
            setStep(0);
            setProgress({ current: 0, total: activeData.length || 0, detail: 'Iniciando...' });
            setMissingPhotosLog([]);
            setShowMissingModal(false);
            setZipBlob(null);
            isCancelled.current = false;
        }
    }, [visible, dataToPrint]);

    // 🔥 GENERADOR DE RUTAS AVANZADO (Ingeniería Inversa para 7004)
    const generateCandidates = (rawPath, defCode, currentSupply, my7004Correlativo) => {
        if (!rawPath) return [];

        let base = String(rawPath).replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/^.*ELIMINADOS\//i, '').replace(/\/0000\//g, '/SINDEF/');
        const parts = base.split('/');
        const originalFileName = parts.pop();
        let rootPathWithoutFile = parts.join('/') + '/';

        const candidates = new Set(); 
        const add = (path, fileName) => {
            candidates.add(path + fileName);
        };

        const is7004 = defCode === "7004" || defCode === "60";

        if (is7004) {
            const folderNum = my7004Correlativo > 0 ? my7004Correlativo : 1;
            let cleanBaseDir = rootPathWithoutFile.replace(/\/7004(\.[^/]+|\/\d+)?\//i, '/7004/');
            const exactFolder = cleanBaseDir.replace(/\/7004\//i, `/7004/${folderNum}/`);
            let exactFileName = originalFileName.replace(/7004(_\d+)?/i, `7004_${folderNum}`);

            // Rutas exactas según guardado móvil
            add(exactFolder, exactFileName);
            add(exactFolder, originalFileName); 

            // Rutas de respaldo
            add(cleanBaseDir, originalFileName); 
            for (let i = 1; i <= 6; i++) {
                add(cleanBaseDir.replace(/\/7004\//i, `/7004/${i}/`), originalFileName);
                add(cleanBaseDir.replace(/\/7004\//i, `/7004/${i}/`), originalFileName.replace(/7004(_\d+)?/i, `7004_${i}`));
            }
        } else {
            add(rootPathWithoutFile, originalFileName);
            
            const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
            if (typeMatch) add(rootPathWithoutFile, `${typeMatch[1]}.${typeMatch[2]}`);

            if (currentSupply && currentSupply !== '0') {
                add(rootPathWithoutFile.replace(`/${defCode}/`, `/${defCode}.1.${currentSupply}/`), originalFileName);
                add(rootPathWithoutFile.replace(`/${defCode}/`, `/${defCode}/${currentSupply}/`), originalFileName);
            }
        }

        const candidatesArray = Array.from(candidates);
        candidatesArray.forEach(cand => {
            const upperCand = cand.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/');
            if (upperCand !== cand) candidates.add(upperCand);
        });

        return Array.from(candidates).map(c => `${API_BASE_URL}${(c.startsWith('/') ? c.substring(1) : c).split('/').map(encodeURIComponent).join('/')}`);
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

    // 🔥 CÁLCULO DE CORRELATIVO REFORZADO
    const calculate7004Correlativo = (def) => {
        const targetGis = def.defiCodigoElemento;
        const sameElement7004s = (dataToPrint || []).filter(d => 
            d.defiCodigoElemento === targetGis && 
            (String(d.tipiCodigo || d.tipificacionLabel || "").includes("7004") || String(d.tipiInterno) === "60")
        );
        sameElement7004s.sort((a, b) => a.defiInterno - b.defiInterno);
        const myIndex = sameElement7004s.findIndex(d => d.defiInterno === def.defiInterno) + 1;
        return myIndex > 0 ? myIndex : 1;
    };

    const startProcessing = async () => {
        const activeData = filterOnlyActive(dataToPrint);

        if (activeData.length === 0) {
            onHide();
            return;
        }

        setStep(1);
        let totalProcessed = 0;
        const currentMissingLog = [];
        let resolvedData = [];
        const tempUrls = []; 

        // 🎯 CÓDIGOS GIS A RASTREAR
        const targetGisCodes = ['PTO000055171', 'VBT000033740', 'VBT000033741', 'VBT000096303'];

        setProgress({ current: 0, total: activeData.length, detail: 'Sincronizando tramos...' });
        const tramosMap = await fetchTramosDictionary(empresaInfo?.sedId);

        for (let i = 0; i < activeData.length; i++) {
            if (isCancelled.current) break;
            
            const def = activeData[i]; 
            const defCode = String(def.tipificacionLabel || "0000").split(' ')[0].trim();
            const currentSupply = String(def.defiNumSuministro || "0").trim();
            const my7004Corr = (defCode === "7004" || def.tipiInterno === 60) ? calculate7004Correlativo(def, activeData) : 0;
            const defUUID = String(def.defiCol3 || "").trim().toLowerCase();

            // 🕵️‍♂️ TRACKER LOGIC
            const isTarget = targetGisCodes.includes(def.defiCodigoElemento);

            if (isTarget) {
                console.log(`\n======================================================`);
                console.log(`🔍 AUDITORÍA GIS: ${def.defiCodigoElemento} | DefID: ${def.defiInterno}`);
                console.log(`▶ Tipi: ${defCode} | Suministro: ${currentSupply}`);
                console.log(`▶ Correlativo 7004 Calculado: ${my7004Corr}`);
                console.log(`▶ UUID Padre (DefiCol3): ${defUUID}`);
            }

            try {
                const response = await api.get('/File/GetByDeficiencyWeb', { params: { x_deficiency: def.defiInterno } });
                const files = (response.data || []).filter(f => f.archActivo === 1 || f.archActivo === true);
                
                if (isTarget) {
                    console.log(`▶ Archivos Activos encontrados en BD para este ID: ${files.length}`, files);
                }

                const photoPromises = [1, 2, 3, 4].map(async (typeId) => {
                    let possibleFiles = files.filter(x => parseInt(x.archTipo) === typeId);
                    
                    if (isTarget) {
                        console.log(`  📸 Buscando Tipo Foto: ${typeId}. Posibles candidatos iniciales: ${possibleFiles.length}`);
                    }

                    if (possibleFiles.length === 0) return { typeId, url: null };
                    
                    // Prioridad por UUID (Bala de plata)
                    if (defUUID && possibleFiles.length > 1) {
                        possibleFiles.sort((a, b) => {
                            const aMatch = String(a.defiUUID || a.DefiUUID || "").trim().toLowerCase() === defUUID;
                            const bMatch = String(b.defiUUID || b.DefiUUID || "").trim().toLowerCase() === defUUID;
                            return (aMatch === bMatch) ? 0 : aMatch ? -1 : 1; 
                        });
                        
                        if (isTarget) {
                            console.log(`  ⚖️ Aplicando orden por UUID. Primer archivo a probar: ID ${possibleFiles[0].archInterno} (UUID: ${possibleFiles[0].defiUUID || possibleFiles[0].DefiUUID})`);
                        }
                    }
                    
                    for (const fileData of possibleFiles) {
                        const candidates = generateCandidates(fileData.archNombre || fileData.ARCH_Nombre, defCode, currentSupply, my7004Corr);
                        
                        if (isTarget) {
                            console.log(`  🛠 Generando rutas para archivo BD [${fileData.archNombre}]. Candidatos:`, candidates);
                        }

                        const url = await getWorkingImageUrl(candidates);
                        
                        if (url) {
                            if (isTarget) console.log(`  ✅ ÉXITO: URL encontrada para tipo ${typeId} ->`, url);
                            return { typeId, url };
                        } else {
                            if (isTarget) console.log(`  ❌ FALLO: Ningún candidato sirvió para el archivo ${fileData.archNombre}`);
                        }
                    }
                    return { typeId, url: null };
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
                    if (isTarget) console.log(`⚠️ ALERTA: Faltaron estas fotos: ${missing.join(', ')}`);
                    currentMissingLog.push({ gis: def.defiCodigoElemento, tipi: defCode, faltantes: missing.join(', ') });
                }

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
                if (isTarget) console.error(`🚨 ERROR CATCH: `, e);
                resolvedData.push({ deficiencia: { ...def, tramOrdenCalculado: 0, tramCodigoCalculado: '', circuitoCalculado: '' }, fotos: {} }); 
                currentMissingLog.push({ gis: def.defiCodigoElemento, tipi: defCode, faltantes: 'ERROR BD' });
            }

            totalProcessed++;
            setProgress({ current: totalProcessed, total: activeData.length, detail: `Procesando: ${totalProcessed}/${activeData.length}` });
        }

        if (isCancelled.current) return;

        // Ordenamiento final
        resolvedData.sort((a, b) => {
            const cA = String(a.deficiencia.tramCodigoCalculado || '').toUpperCase();
            const cB = String(b.deficiencia.tramCodigoCalculado || '').toUpperCase();
            if (cA !== cB) return cA.localeCompare(cB, undefined, { numeric: true });
            return (a.deficiencia.tramOrdenCalculado || 0) - (b.deficiencia.tramOrdenCalculado || 0);
        });

        if (resolvedData.length > 0) {
            setProgress(p => ({ ...p, detail: `Generando PDF comprimido...` }));
            try {
                const zip = new JSZip(); 
                const docElement = <DeficiencyPdfDocument dataList={resolvedData} empresaInfo={empresaInfo} />;
                const pdfInstance = pdf();
                pdfInstance.updateContainer(docElement);
                const blob = await pdfInstance.toBlob();
                zip.file(`Reporte_SED_${empresaInfo?.sed || 'SED'}.pdf`, blob);
                const finalZip = await zip.generateAsync({ type: "blob" });
                setZipBlob(finalZip);
                tempUrls.forEach(u => URL.revokeObjectURL(u));
            } catch (err) {
                console.error(err);
            }
        }

        setMissingPhotosLog(currentMissingLog);
        setStep(2);
    };

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