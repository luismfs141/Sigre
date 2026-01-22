import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Upload, FileText, MapPin, Calendar, Download, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

const AuditElectrical = () => {
    // --- ESTADOS ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [auditDate, setAuditDate] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [compressedImageBlob, setCompressedImageBlob] = useState(null);

    // --- LÓGICA ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setShowReport(false);
        }
    };

    const processImage = () => {
        return new Promise((resolve, reject) => {
            if (!selectedFile) return reject("No file selected");

            const img = new Image();
            img.src = preview;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Lógica de escalado (max width 800px)
                const maxWidth = 800;
                const scale = maxWidth / img.width;
                const width = scale < 1 ? maxWidth : img.width;
                const height = scale < 1 ? img.height * scale : img.height;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Comprimir a JPEG con calidad 0.6
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.6);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleGenerate = async () => {
        if (!selectedFile || !auditDate || !latitude || !longitude) {
            alert("Por favor completa todos los campos y selecciona una imagen.");
            return;
        }

        setIsProcessing(true);

        try {
            const compressedBlob = await processImage();
            setCompressedImageBlob(compressedBlob);
            
            // Formato: Audit_YYYY-MM-DDTHH-mm-ss_Lat_Long.jpg
            const safeDate = auditDate.replace(/[:\s]/g, '-');
            const fileName = `Audit_${safeDate}_${latitude}_${longitude}.jpg`;

            // Crear Zip
            const zip = new JSZip();
            zip.file(fileName, compressedBlob);
            
            // Generar y Descargar Zip
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "Audit_Package.zip");

            setShowReport(true);
        } catch (error) {
            console.error("Error processing:", error);
            alert("Error al procesar la imagen.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="page-header">Auditoría de Sistemas Eléctricos</h1>
                <p className="text-muted-foreground">Generación de evidencia fotográfica y reportes de campo comprimidos.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ---------------- SECCIÓN DE ENTRADA (IZQUIERDA) ---------------- */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h2 className="font-semibold flex items-center gap-2 text-foreground">
                                <FileText className="w-4 h-4 text-primary" />
                                Entrada de Datos
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Input Imagen */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Evidencia Fotográfica</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        className="w-full text-sm text-muted-foreground
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-primary file:text-primary-foreground
                                        hover:file:bg-primary/90
                                        border border-input rounded-md cursor-pointer bg-background"
                                    />
                                </div>
                            </div>

                            {/* Previsualización Pequeña */}
                            {preview && (
                                <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden border border-border flex items-center justify-center">
                                    <img src={preview} alt="Preview" className="h-full object-contain" />
                                </div>
                            )}

                            {/* Fecha y Hora */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    Fecha y Hora (Timestamp)
                                </label>
                                <input 
                                    type="datetime-local" 
                                    step="1"
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    value={auditDate}
                                    onChange={(e) => setAuditDate(e.target.value)}
                                />
                            </div>

                            {/* Coordenadas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        Latitud
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        placeholder="-12.0464"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Longitud</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        placeholder="-77.0428"
                                    />
                                </div>
                            </div>

                            {/* Botón de Acción */}
                            <button 
                                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-md font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleGenerate} 
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" /> Generar Reporte & ZIP
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------------- SECCIÓN DE REPORTE (DERECHA) ---------------- */}
                <div className="lg:col-span-7">
                    {showReport && compressedImageBlob ? (
                        <div className="bg-card border border-border rounded-lg shadow-sm animate-fade-in overflow-hidden">
                            {/* Cabecera del Documento */}
                            <div className="bg-muted/50 p-8 text-center border-b border-border">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Reporte de Auditoría</h2>
                                <p className="text-muted-foreground text-sm mt-1">Documento generado automáticamente</p>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Imagen de Evidencia */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> Evidencia Procesada
                                    </h3>
                                    <div className="rounded-lg border border-border overflow-hidden bg-muted/10 shadow-sm">
                                        <img 
                                            src={URL.createObjectURL(compressedImageBlob)} 
                                            alt="Audit Evidence" 
                                            className="w-full h-auto object-contain max-h-[400px]"
                                        />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground italic">
                                        Imagen comprimida (JPEG q=0.6)
                                    </p>
                                </div>

                                {/* Metadatos */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Metadatos del Registro
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-background border border-border p-4 rounded-md">
                                            <span className="text-xs text-muted-foreground block mb-1">Timestamp</span>
                                            <span className="font-mono text-sm text-foreground font-medium">
                                                {new Date(auditDate).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-background border border-border p-4 rounded-md">
                                            <span className="text-xs text-muted-foreground block mb-1">Geolocalización</span>
                                            <span className="font-mono text-sm text-foreground font-medium">
                                                {latitude}, {longitude}
                                            </span>
                                        </div>
                                        <div className="bg-background border border-border p-4 rounded-md md:col-span-2">
                                            <span className="text-xs text-muted-foreground block mb-1">Estado del Archivo</span>
                                            <div className="flex items-center gap-2">
                                                <span className="badge-success px-2 py-0.5 rounded text-xs font-medium border">
                                                    Optimizado
                                                </span>
                                                <span className="badge-info px-2 py-0.5 rounded text-xs font-medium border">
                                                    Empaquetado en ZIP
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Estado Vacío (Placeholder)
                        <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center p-8 bg-muted/10">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Vista Previa del Reporte</h3>
                            <p className="text-muted-foreground max-w-xs mt-2 text-sm">
                                Complete el formulario y haga clic en "Generar" para ver el reporte de auditoría y descargar los archivos.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditElectrical;