import { useState, useRef } from 'react';

// URL MOCK DE TU API
const API_BASE_URL = "https://tu-api.com/api"; 

// MOCK: Catálogo simple para resolver TIPI_Interno (Esto debería venir de BD)
const TIP_CATALOG = {
    '6002': 37, // Ejemplo: 6002 es ID 37
    '7004': 38,
    '0000': 0
};

export const useInspectionManager = () => {
    const [items, setItems] = useState([]); // Lista visual
    const [loading, setLoading] = useState(false);
    const toastRef = useRef(null);

// hooks/useInspectionManager.js

    // =================================================================
    // 2. RECUPERAR DATOS (GET) - Mapeo SQL -> UI
    // =================================================================
    const loadInspections = async (globalContext) => {
        const { structureCode, type } = globalContext;
        
        if (!structureCode) {
            toastRef.current?.show({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingrese Código GIS para buscar.' });
            return;
        }

        setLoading(true);
        // Limpiamos la lista actual para evitar ver datos viejos o mezclados
        setItems([]); 

        try {
            console.log(`📡 Consultando BD para Elemento: ${structureCode}`);
            
            /* ---------------------------------------------------------
               NOTA PARA TU BACKEND (.NET / NODE):
               Debes ejecutar una Query similar a esta:
               
               SELECT 
                 A.ARCH_Interno, A.ARCH_Nombre, A.ARCH_Latitud, A.ARCH_Longitud, A.ARCH_Fecha,
                 D.DEFI_Codigo, D.DEFI_Observacion, D.TIPI_Interno
               FROM Deficiencias D
               JOIN Archivos A ON D.TABL_Interno = 3 AND A.ARCH_CodTabla = D.DEFI_Interno
               WHERE 
                 D.DEFI_CodigoElemento = @structureCode  -- Ej: PTO000029971
                 AND A.ARCH_Activo = 1
                 AND A.ARCH_Tabla = 'Deficiencias'
               ---------------------------------------------------------
            */

            // --- SIMULACIÓN DE RESPUESTA (MOCK) BASADA EN TUS FOTOS ---
            // Esto simula lo que tu API te respondería al buscar "PTO000029971"
            const mockSqlResponse = [
                {
                    ARCH_Interno: 259038, // ID real de tu imagen 4
                    ARCH_Nombre: `SigreMedios/P_${structureCode}_DEF_112352_IMG_1768...jpg`, // Ruta BD
                    ARCH_Latitud: -12.045, 
                    ARCH_Longitud: -77.031,
                    ARCH_Fecha: '2026-01-22T10:00:00',
                    DEFI_Codigo: '111',       // Código Deficiencia
                    TIPI_Interno: 37,
                    DEFI_Observacion: 'Corrosión leve'
                },
                {
                    ARCH_Interno: 259041, // Otro ID de tu imagen 4
                    ARCH_Nombre: `SigreMedios/P_${structureCode}_DEF_112353_IMG_1768...jpg`,
                    ARCH_Latitud: -12.046,
                    ARCH_Longitud: -77.032,
                    ARCH_Fecha: '2026-01-22T10:05:00',
                    DEFI_Codigo: '6002',      
                    TIPI_Interno: 38,
                    DEFI_Observacion: 'Aislador roto'
                }
            ];

            // SI TIENES EL API LISTO, DESCOMENTA ESTO:
            // const response = await fetch(`${API_BASE_URL}/inspections?code=${structureCode}`);
            // const dbData = await response.json();
            const dbData = mockSqlResponse; // Usamos el mock por ahora

            // --- MAPEO HACIA LA VISTA (UI) ---
            const mappedItems = dbData.map(row => {
                // Truco: Si la ruta en BD es relativa ("SigreMedios/..."), 
                // le agregamos el dominio de tu servidor para poder verla en el navegador.
                const serverUrl = "https://tusservidor.com/uploads/"; 
                
                // Si ya es una URL completa (http...) la dejamos, si no, la construimos
                const previewUrl = row.ARCH_Nombre.startsWith('http') 
                    ? row.ARCH_Nombre 
                    : `https://via.placeholder.com/300x200?text=${row.DEFI_Codigo}`; // Reemplazar con: serverUrl + row.ARCH_Nombre

                return {
                    id: row.ARCH_Interno,            
                    deficiencyCode: row.DEFI_Codigo, 
                    tipiInterno: row.TIPI_Interno,   
                    detail: row.DEFI_Observacion,
                    date: new Date(row.ARCH_Fecha),
                    lat: row.ARCH_Latitud || 0,
                    long: row.ARCH_Longitud || 0,
                    preview: previewUrl, 
                    file: null, // Viene de BD, no es un archivo nuevo "raw"
                    originalPath: row.ARCH_Nombre // Guardamos la ruta original para referencia
                };
            });

            setItems(mappedItems);
            
            if (mappedItems.length > 0) {
                toastRef.current?.show({ severity: 'success', summary: 'Datos Encontrados', detail: `Se cargaron ${mappedItems.length} evidencias.` });
            } else {
                toastRef.current?.show({ severity: 'info', summary: 'Sin Datos', detail: 'No hay evidencias activas para este código.' });
            }

        } catch (e) {
            console.error(e);
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Fallo al consultar Base de Datos' });
        } finally {
            setLoading(false);
        }
    };

    // =================================================================
    // 2. ELIMINAR (Soft Delete)
    // =================================================================
    const deleteInspection = async (id) => {
        // Optimistic Update
        const prevItems = [...items];
        setItems(prev => prev.filter(item => item.id !== id));

        try {
            console.log(`🗑️ Soft Delete en BD ID: ${id} (UPDATE Archivos SET ARCH_Activo = 0)`);
            // await fetch(`${API_BASE_URL}/archivos/${id}`, { method: 'DELETE' });
            toastRef.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Registro desactivado.' });
        } catch (e) {
            setItems(prevItems); 
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
        }
    };

    // =================================================================
    // 3. GUARDAR (POST/PUT) - Solución a TIPI_Interno NULL
    // =================================================================
    const saveInspection = async (formData, isEdit, globalContext) => {
        setLoading(true);
        try {
            const payload = new FormData();

            // 1. Resolver TIPI_Interno (El problema que mencionaste)
            // Si el usuario escribió "6002", buscamos su ID interno.
            // En producción, esto lo debería validar el Backend o tener un catálogo cargado.
            const code = String(formData.deficiencyCode).trim();
            const resolvedTipiId = TIP_CATALOG[code] || 0; // 0 si no existe

            if (resolvedTipiId === 0 && code !== '0000') {
                 console.warn("⚠️ Código no reconocido en catálogo local, enviando como 0");
            }

            // 2. Datos del Archivo (Tabla Archivos)
            payload.append('ARCH_Latitud', formData.lat);
            payload.append('ARCH_Longitud', formData.long);
            payload.append('ARCH_Fecha', formData.date ? formData.date.toISOString() : new Date().toISOString());
            payload.append('TIPI_Interno', resolvedTipiId); // ✅ AQUÍ ENVIAMOS EL ID CORREGIDO
            
            // 3. Datos de Contexto Global (Para las carpetas y FKs)
            payload.append('alimentador', globalContext.feederLabel);
            payload.append('sed', globalContext.sedCode);
            payload.append('tipoElemento', globalContext.structureType === 'Poste' ? 'POST' : 'VANO');
            payload.append('idElemento', globalContext.structureCode); // O el ID interno si lo tienes
            
            // 4. Archivo físico
            if (formData.file) {
                payload.append('archivo', formData.file); 
            }

            console.log(`💾 Guardando en BD... TIPI_Interno: ${resolvedTipiId}, Contexto: ${globalContext.feederLabel}/${globalContext.structureCode}`);

            // await fetch(...)

            // Actualización Local
            const savedItem = {
                ...formData,
                id: isEdit ? formData.id : Date.now(),
                tipiInterno: resolvedTipiId,
                preview: formData.preview, 
                file: formData.file 
            };

            if (isEdit) {
                setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem : i));
            } else {
                setItems(prev => [...prev, savedItem]);
            }

            toastRef.current?.show({ severity: 'success', summary: 'Guardado', detail: 'Datos sincronizados.' });
            return true;

        } catch (e) {
            console.error("Error al guardar:", e);
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    
    

    return { items, loading, loadInspections, deleteInspection, saveInspection, toastRef };
};