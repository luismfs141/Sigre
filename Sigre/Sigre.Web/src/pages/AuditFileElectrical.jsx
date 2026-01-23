import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Download, 
  Settings, 
  Camera, 
  MapPin, 
  Calendar, 
  FileImage, 
  Loader2,
  List
} from 'lucide-react';

const AuditFileElectrical = () => {
    // --- ESTADOS DE CONTEXTO (Global para el ZIP) ---
    const [feederLabel, setFeederLabel] = useState('');
    const [sedCode, setSedCode] = useState('');
    const [structureType, setStructureType] = useState('Poste'); // 'Poste' o 'Vano'
    const [structureCode, setStructureCode] = useState('');
    
    // --- ESTADOS DE LISTA (Items acumulados) ---
    const [items, setItems] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- ESTADOS TEMPORALES (Nuevo Item) ---
    const [currentFile, setCurrentFile] = useState(null);
    const [currentPreview, setCurrentPreview] = useState(null);
    const [currentDeficiencyCode, setCurrentDeficiencyCode] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [currentLat, setCurrentLat] = useState('');
    const [currentLong, setCurrentLong] = useState('');

    // --- UTILIDADES ---
    const safeSeg = (val, def = "SIN_DATA") => {
        if (!val || val.toString().trim() === "") return def;
        return val.toString().trim().replace(/[\\/:*?"<>|]/g, '_');
    };

    // --- LÓGICA DE EVENTOS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCurrentFile(file);
            setCurrentPreview(URL.createObjectURL(file));
            
            // Auto-rellenar fecha actual
            const now = new Date();
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
            alert("Por favor completa todos los campos del ítem, incluyendo la foto.");
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
        
        // Resetear campos del ítem (manteniendo fecha/lat/long vacío o como prefieras)
        setCurrentFile(null);
        setCurrentPreview(null);
        setCurrentDeficiencyCode('');
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleGenerateZip = async () => {
        if (items.length === 0) {
            alert("No hay ítems para generar.");
            return;
        }
        if (!feederLabel || !structureCode) {
            alert("Por favor completa la Información de Estructura (Alimentador, Código GIS).");
            return;
        }

        setIsProcessing(true);

        try {
            const zip = new JSZip();
            const rootFolder = "SIGRE.MOVIL";
            let correlative7004 = 0;

            for (const item of items) {
                const compressedBlob = await processImage(item.file);
                
                // Lógica excepción 7004
                let extraFolder = "";
                if (item.deficiencyCode === '7004') {
                    correlative7004 += 1;
                    extraFolder = `/${correlative7004}`;
                }

                // Ruta: SIGRE.MOVIL / Feeder / SED / Type / StructureCode / DeficiencyCode (/ Correlative)
                const path = `${rootFolder}/${safeSeg(feederLabel)}/${safeSeg(sedCode, "SINSED")}/${structureType === "Vano" ? "Vano" : "Poste"}/${safeSeg(structureCode)}/${safeSeg(item.deficiencyCode, "SINDEF")}${extraFolder}`;

                // Nombre Archivo: GIS_Deficiency_Date_Lat_Long.jpg
                const safeDate = item.date.replace(/[:\s]/g, '-');
                const fileName = `${safeSeg(structureCode)}_${safeSeg(item.deficiencyCode)}_${safeDate}_${item.lat}_${item.long}.jpg`;
                
                zip.folder(path).file(fileName, compressedBlob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Audit_Report__${structureCode}.zip`);

        } catch (error) {
            console.error("Error generating ZIP:", error);
            alert("Falló la generación del ZIP.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="page-header text-primary">Auditoría Multi-Archivo</h1>
                <p className="text-muted-foreground">Gestión masiva de evidencias y estructuración automática de carpetas.</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* ---------------- COLUMNA IZQUIERDA (CONFIGURACIÓN + INPUT) ---------------- */}
                <div className="xl:col-span-1 space-y-6">
                    
                    {/* 1. Configuración Global */}
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" />
                            <h2 className="font-semibold text-sm text-foreground uppercase tracking-wide">1. Estructura Global</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Alimentador</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    value={feederLabel} 
                                    onChange={e => setFeederLabel(e.target.value)} 
                                    placeholder="Ej. MEJIA" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Código SED</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    value={sedCode} 
                                    onChange={e => setSedCode(e.target.value)} 
                                    placeholder="Ej. 8201" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Tipo</label>
                                    <select 
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                        value={structureType} 
                                        onChange={e => setStructureType(e.target.value)}
                                    >
                                        <option value="Poste">POSTE</option>
                                        <option value="Vano">VANO</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Código GIS</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                        value={structureCode} 
                                        onChange={e => setStructureCode(e.target.value)} 
                                        placeholder="Ej. PTOO..." 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Formulario de Ítem */}
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                            <Camera className="w-4 h-4 text-primary" />
                            <h2 className="font-semibold text-sm text-foreground uppercase tracking-wide">2. Nueva Evidencia</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Cód. Deficiencia</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono"
                                    value={currentDeficiencyCode} 
                                    onChange={e => setCurrentDeficiencyCode(e.target.value)} 
                                    placeholder="Ej. 6002" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Fotografía</label>
                                <input 
                                    type="file" 
                                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer border border-input rounded-md bg-background"
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                            </div>

                            {currentPreview && (
                                <div className="relative rounded-md overflow-hidden border border-border h-32 flex justify-center bg-muted/20">
                                    <img src={currentPreview} alt="Preview" className="h-full object-contain" />
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-muted-foreground" /> Fecha
                                </label>
                                <input 
                                    type="datetime-local" 
                                    step="1" 
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    value={currentDate} 
                                    onChange={e => setCurrentDate(e.target.value)} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-muted-foreground" /> Latitud
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                        placeholder="-12.000" 
                                        value={currentLat} 
                                        onChange={e => setCurrentLat(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Longitud</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                        placeholder="-77.000" 
                                        value={currentLong} 
                                        onChange={e => setCurrentLong(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <button 
                                className="w-full mt-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                onClick={addItem}
                            >
                                <Plus className="w-4 h-4" /> Agregar a la Lista
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------------- COLUMNA DERECHA (LISTA DE ÍTEMS) ---------------- */}
                <div className="xl:col-span-2">
                    <div className="bg-card border border-border rounded-lg shadow-sm h-full flex flex-col">
                        
                        {/* Header Lista */}
                        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
                            <div className="flex items-center gap-2">
                                <List className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold text-foreground">
                                    Elementos Seleccionados 
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                                        {items.length}
                                    </span>
                                </h2>
                            </div>
                            <button 
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isProcessing || items.length === 0} 
                                onClick={handleGenerateZip}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                                    </>
                                ) : (
                                    <>
                                        <FolderOpen className="w-4 h-4" /> Generar ZIP
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Contenido Lista */}
                        <div className="flex-1 p-0 overflow-auto min-h-[400px] max-h-[800px]">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 opacity-50">
                                        <FileImage className="w-8 h-8" />
                                    </div>
                                    <p className="font-medium">Lista vacía</p>
                                    <p className="text-sm max-w-xs text-center mt-1">
                                        Complete el formulario de la izquierda y presione "Agregar" para comenzar a armar su reporte.
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Vista Previa</th>
                                            <th className="px-4 py-3 font-medium">Deficiencia</th>
                                            <th className="px-4 py-3 font-medium">Detalles</th>
                                            <th className="px-4 py-3 font-medium text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map(item => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="w-16 h-16 rounded border border-border overflow-hidden bg-background">
                                                        <img 
                                                            src={item.preview} 
                                                            alt="Thumb" 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="badge-info px-2 py-1 rounded-md text-xs font-bold font-mono border">
                                                        {item.deficiencyCode}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(item.date).toLocaleString()}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="font-mono">{item.lat}, {item.long}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button 
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                        onClick={() => removeItem(item.id)}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuditFileElectrical;