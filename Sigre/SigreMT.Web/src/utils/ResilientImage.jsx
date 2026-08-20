import React, { useState, useEffect, useMemo } from 'react';
import { Image } from 'primereact/image';
import { API_BASE_URL } from '../utils/ngrok';

// 1. Motor de búsqueda con cruce de alias SINDEF/0000 y 7004
export const buildImageCandidates = (row, historicalData, getCodeById) => {
    const rawPath = row.originalName || row.currentPath;
    if (!rawPath) return [];

    let base = rawPath.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/^.*ELIMINADOS\//i, '');
    const candidates = new Set();
    const baseUrl = API_BASE_URL.replace(/\/+$/, '');
    
    const parts = base.split('/');
    const fileName = parts.pop();
    const folderPath = parts.join('/');
    
    if (!fileName) return [];

    const formatUrl = (f, n) => `${baseUrl}/${f.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}/${encodeURIComponent(n)}`;

    // --- 1. IDENTIFICACIÓN ---
    const targetDef = historicalData?.find(d => d.defiInterno === row.selectedDeficiencyId);
    const defCode = targetDef ? (getCodeById(targetDef.tipiInterno) || '0000') : '0000';
    const normalizedCode = String(defCode).trim().toUpperCase();
    const isSinDef = normalizedCode === '0000' || normalizedCode === '0' || normalizedCode === 'SINDEF';

    // --- 2. GENERACIÓN DE VARIANTES ---
    
    // Variantes de Carpeta (Tipos y Alias)
    const getFolderVariants = (path) => {
        let v = new Set([path]);
        // Corregir Poste/Vano (Mayúsculas)
        v.add(path.replace(/\/Poste\//i, '/POSTE/').replace(/\/Vano\//i, '/VANO/'));
        
        // Intercambio de Alias en Carpeta
        if (path.toUpperCase().includes('/SINDEF/')) v.add(path.replace(/\/SINDEF\//gi, '/0000/'));
        if (path.toUpperCase().includes('/0000/')) v.add(path.replace(/\/0000\//gi, '/SINDEF/'));
        
        // Caso extremo: Si la ruta no trae el alias pero es SINDEF, se lo inyectamos
        if (isSinDef && !path.toUpperCase().includes('/SINDEF/') && !path.toUpperCase().includes('/0000/')) {
            const pathParts = path.split('/');
            const fileNamePart = pathParts.pop(); 
            const newBase = pathParts.join('/');
            v.add(`${newBase}/SINDEF`);
            v.add(`${newBase}/0000`);
        }
        return Array.from(v);
    };

    // Variantes de Nombre de Archivo
    const getNameVariants = (name) => {
        let n = new Set([name]);
        if (name.includes('SINDEF')) n.add(name.replace('SINDEF', '0000'));
        if (name.includes('0000')) n.add(name.replace('0000', 'SINDEF'));
        return Array.from(n);
    };

    const folderVariants = getFolderVariants(folderPath);
    const nameVariants = getNameVariants(fileName);

    // --- 3. CRUCE DE FUERZA BRUTA (MATRIZ) ---
    folderVariants.forEach(f => {
        nameVariants.forEach(n => {
            // A. Caso SINDEF (Carpeta plana, sin /1/ /2/)
            if (isSinDef) {
                candidates.add(formatUrl(f, n));
                // Forzamos el cruce manual de los 4 casos que pediste
                const baseFolder = f.replace(/\/(SINDEF|0000)$/i, '');
                candidates.add(formatUrl(`${baseFolder}/SINDEF`, n));
                candidates.add(formatUrl(`${baseFolder}/0000`, n));
            } 
            
            // B. Caso 7004 (Subcarpetas correlativas)
            else if (normalizedCode === '7004' || f.includes('7004')) {
                candidates.add(formatUrl(f, n));
                const pathRoot = f.split('/7004')[0];
                for (let i = 1; i <= 10; i++) {
                    candidates.add(formatUrl(`${pathRoot}/7004/${i}`, n));
                    candidates.add(formatUrl(`${pathRoot}/7004.1.${i}`, n));
                }
            }

            // C. Intento estándar para cualquier otro código
            else {
                candidates.add(formatUrl(f, n));
            }
        });
    });

    // Fallback de nombre corto (ej: 6.jpg)
    const typeMatch = fileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
    if (typeMatch) {
        const short = `${typeMatch[1]}.${typeMatch[2]}`;
        folderVariants.forEach(f => candidates.add(formatUrl(f, short)));
    }

    return Array.from(candidates);
};

export default function ResilientImage({ row, historicalData, getCodeById, sessionBlobs }) {
    const isAudio = parseInt(row.archTipo) === 0;
    const offlinePlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23eeeeee%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999999%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C%2Ftext%3E%3C%2Fsvg%3E";

    const candidates = useMemo(() => {
        if (isAudio) return [];
        return buildImageCandidates(row, historicalData, getCodeById);
    }, [row.currentPath, row.originalName, isAudio, historicalData, getCodeById]);

    const [currentSrc, setCurrentSrc] = useState(candidates[0] || offlinePlaceholder);
    const [tryIndex, setTryIndex] = useState(0);

    useEffect(() => {
        setTryIndex(0);
        setCurrentSrc(candidates[0] || offlinePlaceholder);
    }, [candidates]);

    const handleError = () => {
        const next = tryIndex + 1;
        if (next < candidates.length) {
            setTryIndex(next);
            setCurrentSrc(candidates[next]);
        } else {
            setCurrentSrc(offlinePlaceholder);
        }
    };

    const originalFileName = (row.originalName || "").split(/[/\\]/).pop();

    if (sessionBlobs?.current?.[originalFileName]) {
        if (isAudio) return <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800 text-white"><i className="pi pi-volume-up text-3xl"></i></div>;
        return <Image src={URL.createObjectURL(sessionBlobs.current[originalFileName])} alt="Local" preview className="absolute inset-0 w-full h-full" imageClassName="w-full h-full object-cover" />;
    }

    if (isAudio) {
        return (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800 text-white border border-slate-700">
                <i className="pi pi-volume-up text-3xl"></i>
            </div>
        );
    }

    return (
        <Image 
            src={currentSrc} 
            alt="Evidencia" 
            preview={currentSrc !== offlinePlaceholder}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100" 
            imageClassName="w-full h-full object-cover"
            loading="lazy"
            onError={handleError}
        />
    );
}