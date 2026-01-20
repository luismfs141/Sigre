import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import DatePicker from 'react-datepicker'; // Assuming unavailable, so will use standard input
import 'bootstrap/dist/css/bootstrap.min.css';
import { format } from 'date-fns';

const AuditElectrical = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [auditDate, setAuditDate] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [compressedImageBlob, setCompressedImageBlob] = useState(null);

    const canvasRef = useRef(null);

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
                // Scale down logic (e.g., max width 800px)
                const maxWidth = 800;
                const scale = maxWidth / img.width;
                const width = scale < 1 ? maxWidth : img.width;
                const height = scale < 1 ? img.height * scale : img.height;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.6 quality
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.6);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleGenerate = async () => {
        if (!selectedFile || !auditDate || !latitude || !longitude) {
            alert("Please fill all fields and select an image.");
            return;
        }

        setIsProcessing(true);

        try {
            const compressedBlob = await processImage();
            setCompressedImageBlob(compressedBlob);
            
            // Create Filename based on inputs
            // Format: Audit_YYYY-MM-DDTHH-mm-ss_Lat_Long.jpg
            const safeDate = auditDate.replace(/[:\s]/g, '-');
            const fileName = `Audit_${safeDate}_${latitude}_${longitude}.jpg`;

            // Create Zip
            const zip = new JSZip();
            zip.file(fileName, compressedBlob);
            
            // Generate Zip
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "Audit_Package.zip");

            setShowReport(true);
        } catch (error) {
            console.error("Error processing:", error);
            alert("Error processing image.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container-fluid p-4">
            <h2 className="mb-4 text-primary">Audit Electrical Systems</h2>
            
            <div className="row">
                {/* Input Section */}
                <div className="col-md-5">
                    <div className="card shadow-sm p-3 mb-4">
                        <h4 className="card-title mb-3">Data Entry</h4>
                        
                        <div className="mb-3">
                            <label className="form-label">Upload Picture</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                        </div>

                        {preview && (
                            <div className="mb-3 text-center">
                                <img src={preview} alt="Preview" className="img-thumbnail" style={{ maxHeight: '200px' }} />
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Date & Time (Seconds)</label>
                            <input 
                                type="datetime-local" 
                                step="1"
                                className="form-control" 
                                value={auditDate}
                                onChange={(e) => setAuditDate(e.target.value)}
                            />
                        </div>

                        <div className="row mb-3">
                            <div className="col">
                                <label className="form-label">Latitude</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    placeholder="-12.0464"
                                />
                            </div>
                            <div className="col">
                                <label className="form-label">Longitude</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    placeholder="-77.0428"
                                />
                            </div>
                        </div>

                        <button 
                            className="btn btn-success w-100" 
                            onClick={handleGenerate} 
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing & Zipping...' : 'Generate Report & Zip'}
                        </button>
                    </div>
                </div>

                {/* Report Section */}
                <div className="col-md-7">
                    {showReport && compressedImageBlob && (
                        <div className="card shadow border-0" id="report-section">
                            <div className="card-body">
                                <div className="text-center mb-4">
                                    <h1 className="display-6 fw-bold">Electrical Audit Report</h1>
                                    <p className="text-muted">Field Inspection Generated Document</p>
                                    <hr />
                                </div>
                                
                                <div className="row align-items-center">
                                    <div className="col-md-12 text-center mb-3">
                                        <img 
                                            src={URL.createObjectURL(compressedImageBlob)} 
                                            alt="Audit Evidence" 
                                            className="img-fluid rounded border border-secondary"
                                            style={{ maxHeight: '500px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                                        />
                                        <p className="mt-2 text-muted fst-italic">Compressed Evidence Image</p>
                                    </div>
                                </div>

                                <div className="row mt-4">
                                    <div className="col-md-12">
                                        <div className="alert alert-light border border-info">
                                            <h5 className="alert-heading text-info">Metadata</h5>
                                            <ul className="list-group list-group-flush bg-transparent">
                                                <li className="list-group-item bg-transparent">
                                                    <strong>Timestamp:</strong> {new Date(auditDate).toLocaleString()}
                                                </li>
                                                <li className="list-group-item bg-transparent">
                                                    <strong>Coordinates:</strong> {latitude}, {longitude}
                                                </li>
                                                <li className="list-group-item bg-transparent">
                                                    <strong>Image Status:</strong> Compressed & Optimized
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {!showReport && (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted p-5 bg-light rounded border border-dashed">
                            <p className="lead">Fill the form and generate to view the Report Preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditElectrical;
