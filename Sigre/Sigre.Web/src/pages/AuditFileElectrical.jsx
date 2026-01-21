import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

const AuditFileElectrical = () => {
    // Context State (Global for the ZIP/Structure)
    const [feederLabel, setFeederLabel] = useState('');
    const [sedCode, setSedCode] = useState('');
    const [structureType, setStructureType] = useState('Poste'); // 'Poste' or 'Vano'
    const [structureCode, setStructureCode] = useState('');
    
    // Items State (List of Deficiencies/Photos)
    const [items, setItems] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Temp State for new Item entry
    const [currentFile, setCurrentFile] = useState(null);
    const [currentPreview, setCurrentPreview] = useState(null);
    const [currentDeficiencyCode, setCurrentDeficiencyCode] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [currentLat, setCurrentLat] = useState('');
    const [currentLong, setCurrentLong] = useState('');

    const safeSeg = (val, def = "SIN_DATA") => {
        if (!val || val.toString().trim() === "") return def;
        // Simple sanitization to avoid invalid path characters
        return val.toString().trim().replace(/[\\/:*?"<>|]/g, '_');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCurrentFile(file);
            setCurrentPreview(URL.createObjectURL(file));
            
            // Auto fill date/location if possible (Mocking for now or browser API)
            // Just defaulting date for convenience
            const now = new Date();
            // Format YYYY-MM-DDTHH:mm:ss for input type="datetime-local"
            const isoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
            setCurrentDate(isoString);
        }
    };

    const processImage = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) return reject("No file provided");

            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 800;
                const scale = maxWidth / img.width;
                const width = scale < 1 ? maxWidth : img.width;
                const height = scale < 1 ? img.height * scale : img.height;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.6);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const addItem = () => {
        if (!currentFile || !currentDeficiencyCode || !currentDate || !currentLat || !currentLong) {
            alert("Please fill all item fields including the photo.");
            return;
        }

        const newItem = {
            id: Date.now(),
            file: currentFile,
            preview: currentPreview,
            deficiencyCode: currentDeficiencyCode,
            date: currentDate,
            lat: currentLat,
            long: currentLong
        };

        setItems([...items, newItem]);
        // Reset Item fields
        setCurrentFile(null);
        setCurrentPreview(null);
        setCurrentDeficiencyCode('');
        // Keep Date/Lat/Long maybe? Usually photos in sequence have similar location. 
        // Let's keep Lat/Long, reset Date.
        // setCurrentDate(''); 
        // setCurrentLat('');
        // setCurrentLong('');
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleGenerateZip = async () => {
        if (items.length === 0) {
            alert("No items to generate.");
            return;
        }
        if (!feederLabel || !structureCode) {
            alert("Please fill the global Structure Information (Feeder, Element Code).");
            return;
        }

        setIsProcessing(true);

        try {
            const zip = new JSZip();
            const rootFolder = "SIGRE.MOVIL";

            for (const item of items) {
                const compressedBlob = await processImage(item.file);
                
                // Path Logic: SIGRE.MOVIL / Feeder / SED / Type / StructureCode / DeficiencyCode
                 const path = `${rootFolder}/${safeSeg(feederLabel)}/${safeSeg(sedCode, "SINSED")}/${structureType === "Vano" ? "Vano" : "Poste"}/${safeSeg(structureCode)}/${safeSeg(item.deficiencyCode, "SINDEF")}`;

                // Filename Logic: Audit_YYYY-MM-DDTHH-mm-ss_Lat_Long.jpg
                const safeDate = item.date.replace(/[:\s]/g, '-');
                const fileName = `Audit_${safeDate}_${item.lat}_${item.long}.jpg`;
                
                zip.folder(path).file(fileName, compressedBlob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Audit_Report_${structureCode}.zip`);

        } catch (error) {
            console.error("Error generating ZIP:", error);
            alert("Failed to generate ZIP.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container-fluid p-4">
            <h2 className="mb-4 text-warning">Auditoría Eléctrica Multi-Archivo</h2>
            <div className="row">
                <div className="col-md-4">
                    {/* GLOBAL CONFIGURATION */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-warning text-dark">
                            <h5 className="mb-0">1. Estructura de la deficiencia</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Etiqueta de Alimentador (Alim. Etiqueta)</label>
                                <input type="text" className="form-control" value={feederLabel} onChange={e => setFeederLabel(e.target.value)} placeholder="e.g. A-123" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">SED Codigo</label>
                                <input type="text" className="form-control" value={sedCode} onChange={e => setSedCode(e.target.value)} placeholder="e.g. SED-001" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Tipo</label>
                                <select className="form-select" value={structureType} onChange={e => setStructureType(e.target.value)}>
                                    <option value="Poste">POSTE</option>
                                    <option value="Vano">VANO</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">GIS Codigo ({structureType})</label>
                                <input type="text" className="form-control" value={structureCode} onChange={e => setStructureCode(e.target.value)} placeholder="e.g. PTOO.../VBT..." />
                            </div>
                        </div>
                    </div>

                    {/* ADD NEW ITEM FORM */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="mb-0">2. Añadir una deficiencia / FOTO</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Código de Deficiencia</label>
                                <input type="text" className="form-control" value={currentDeficiencyCode} onChange={e => setCurrentDeficiencyCode(e.target.value)} placeholder="e.g. D-05" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Foto</label>
                                <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                            </div>
                            {currentPreview && <img src={currentPreview} alt="Preview" className="img-thumbnail mb-3" style={{maxHeight:'150px'}}/>}
                            
                            <div className="mb-3">
                                <label className="form-label">Fecha</label>
                                <input type="datetime-local" step="1" className="form-control" value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
                            </div>
                            <div className="row mb-3">
                                <div className="col">
                                    <input type="text" className="form-control" placeholder="Lat" value={currentLat} onChange={e => setCurrentLat(e.target.value)} />
                                </div>
                                <div className="col">
                                    <input type="text" className="form-control" placeholder="Long" value={currentLong} onChange={e => setCurrentLong(e.target.value)} />
                                </div>
                            </div>
                            <button className="btn btn-secondary w-100" onClick={addItem}>Añadir a la Lista</button>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    {/* ITEMS LIST */}
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Elementos Seleccionados ({items.length})</h5>
                            <button className="btn btn-warning fw-bold" disabled={isProcessing} onClick={handleGenerateZip}>
                                {isProcessing ? 'Processing ZIP...' : 'Generate Folders & ZIP'}
                            </button>
                        </div>
                        <div className="card-body overflow-auto" style={{ maxHeight: '80vh' }}>
                            {items.length === 0 ? (
                                <p className="text-muted text-center mt-5">No items added yet. Fill the forms on the left to add items.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>Vista Previa</th>
                                                <th>Deficiencia</th>
                                                <th>Metadatos</th>
                                                <th>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <img src={item.preview} alt="Min" style={{width: '60px', height: '60px', objectFit: 'cover'}} className="rounded" />
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-info text-dark">{item.deficiencyCode}</span>
                                                    </td>
                                                    <td className="small">
                                                        <div><strong>Date:</strong> {item.date}</div>
                                                        <div><strong>Loc:</strong> {item.lat}, {item.long}</div>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item.id)}>×</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditFileElectrical;
