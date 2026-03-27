import React, { useState, useEffect, useMemo } from 'react';
import { Image } from 'primereact/image';
import { API_BASE_URL } from './ngrok';

const ResilientImage = ({ 
    file, 
    index, 
    onImageClick, 
    onUrlResolved, 
    typeName, 
    currentSupply, 
    defCode, 
    onDelete, 
    onCropRequest, 
    onReplaceRequest, 
    allowDirectEdit, 
    cacheBuster 
}) => {
    const offlinePlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23eeeeee%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999999%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C%2Ftext%3E%3C%2Fsvg%3E";

    const generateCandidates = (rawPath) => {
        if (!rawPath) return [];

        let base = rawPath
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

        // 🔥 LA VERSIÓN MEJORADA (Con resiliencia para el parche 7004)
        const buildFolderAliasVariants = (folderPath) => {
            const variants = new Set([folderPath]);

            // 1. Variantes Clásicas SINDEF/0000
            if (/\/SINDEF\//i.test(folderPath)) {
                variants.add(folderPath.replace(/\/SINDEF\//gi, '/0000/'));
            }
            if (/\/0000\//i.test(folderPath)) {
                variants.add(folderPath.replace(/\/0000\//gi, '/SINDEF/'));
            }

            // 2. EL PARCHE 7004: Convertir ruta "sucia" de BD a ruta "limpia" física
            const dirty7004Regex = /\/(7004)\.(\d+)\.([a-zA-Z0-9]+)\//i;
            const matchDirty = folderPath.match(dirty7004Regex);
            
            if (matchDirty) {
                const fullDirtyPath = matchDirty[0]; // Ej: "/7004.1.149262/"
                const defCodeMatched = matchDirty[1];       // Ej: "7004"
                const correlativo = matchDirty[2];   // Ej: "1"
                
                // Agregamos la variante limpia: /7004/1/
                const cleanPath = `/${defCodeMatched}/${correlativo}/`;
                variants.add(folderPath.replace(fullDirtyPath, cleanPath));
                
                // Por si acaso, agregamos la variante de un solo nivel: /7004/
                variants.add(folderPath.replace(fullDirtyPath, `/${defCodeMatched}/`));
            }

            return Array.from(variants);
        };

        const addPathVariations = (folderPath) => {
            if (!folderPath) return;

            for (const variantPath of buildFolderAliasVariants(folderPath)) {
                candidates.add(`${variantPath}${originalFileName}`);

                if (shortFileName) {
                    candidates.add(`${variantPath}${shortFileName}`);
                }
            }
        };

        const normalizedDefCode = String(defCode || '').trim().toUpperCase();
        const defCodesToTry =
            normalizedDefCode === '0000' ||
                normalizedDefCode === '0' ||
                normalizedDefCode === 'SINDEF'
                ? ['SINDEF', '0000']
                : [normalizedDefCode];

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

        // 🔥 Aquí es donde aplicamos el rompe-caché para que React descargue la nueva foto tras hacer Crop/Replace
        return Array.from(candidates).map((candidatePath) =>
            `${API_BASE_URL}/${(candidatePath.startsWith('/') ? candidatePath.substring(1) : candidatePath)
                .split('/')
                .map(encodeURIComponent)
                .join('/')}?t=${cacheBuster}`
        );
    };

    const candidates = useMemo(
        () => generateCandidates(file.archNombre || file.ARCH_Nombre),
        [file, currentSupply, defCode, cacheBuster]
    );

    const [currentSrc, setCurrentSrc] = useState(candidates[0] || offlinePlaceholder);
    const [tryIndex, setTryIndex] = useState(0);

    useEffect(() => { setTryIndex(0); setCurrentSrc(candidates[0] || offlinePlaceholder); }, [candidates]);
    const handleLoad = () => { if (currentSrc !== offlinePlaceholder) onUrlResolved(index, currentSrc); };
    const handleError = () => { const next = tryIndex + 1; if (next < candidates.length) { setTryIndex(next); setCurrentSrc(candidates[next]); } else setCurrentSrc(offlinePlaceholder); };

    // Detectamos si es tipo 6 (Adicional)
    const esTipoAdicional = String(file.archTipo || file.ARCH_Tipo) === "6";

    return (
        <div className="h-24 w-24 rounded border overflow-hidden relative cursor-pointer group hover:shadow-lg transition-all">
            <div onClick={() => onImageClick(index)} className="w-full h-full">
                <Image src={currentSrc} alt="Foto" preview={false} width="100%" className="w-full h-full object-cover" onError={handleError} onLoad={handleLoad} />
            </div>

            {/* BOTÓN ROJO: ELIMINAR (Siempre visible) */}
            <button onClick={(e) => { e.stopPropagation(); onDelete(file); }} className="absolute top-0 right-0 !bg-red-600 text-white w-7 h-7 border-2 border-white flex items-center justify-center rounded-bl-md shadow-md hover:!bg-red-700 transition-all z-20" title="Eliminar foto">
                <i className="pi pi-trash text-xs font-bold"></i>
            </button>

            {/* 🔥 BOTONES DE EDICIÓN (Reemplazar y Recortar) */}
            {allowDirectEdit && (
                <>
                    {/* Botón Verde: REEMPLAZAR */}
                    <input type="file" id={`replace-file-${index}`} className="hidden" accept="image/*"
                        onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.files && e.target.files.length > 0) onReplaceRequest(file, e.target.files[0]);
                        }}
                    />
                    <label htmlFor={`replace-file-${index}`} onClick={(e) => e.stopPropagation()} className="absolute top-0 left-0 bg-green-600 text-white w-7 h-7 border-2 border-white flex items-center justify-center rounded-br-md shadow-md hover:bg-green-700 transition-all z-20 cursor-pointer" title="Reemplazar foto física">
                        <i className="pi pi-upload text-xs font-bold"></i>
                    </label>

                    {/* Botón Azul: RECORTAR (Anclado abajo a la derecha, diseño Senior) */}
                    {esTipoAdicional && currentSrc !== offlinePlaceholder && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCropRequest(file, currentSrc);
                            }}
                            className="absolute bottom-0 right-0 bg-blue-600 text-white w-7 h-7 border-2 border-white flex items-center justify-center rounded-tl-md shadow-md hover:bg-blue-700 transition-all z-30"
                            title="Enfocar Deficiencia"
                        >
                            <i className="pi pi-search-plus text-xs font-bold"></i>
                        </button>
                    )}
                </>
            )}
            
            {/* Etiqueta inferior con el nombre del tipo (Ej: PANORÁMICA, ADICIONAL) */}
            <div className="absolute bottom-0 w-full bg-black/70 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-tighter z-10">{typeName}</div>
        </div>
    );
};

export default ResilientImage;