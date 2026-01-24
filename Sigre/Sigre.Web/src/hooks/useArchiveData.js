import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- TUS HOOKS EXISTENTES ---
import { useDeficiencyByGis } from '../hooks/useDeficiencyByGis';
import { useFiles } from '../hooks/useFiles'; 
import { useTypification } from '../hooks/useTypification'; 

// --- COMPONENTES UI ---
import HistoricalTable from './HistoricalTable';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner'; // Para indicar carga de BD

// Función utilitaria para limpiar textos en rutas
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

// ✅✅✅ NUEVO HOOK SIMULADO (REEMPLAZAR CON TU API REAL) ✅✅✅
// Este hook simula la consulta a la tabla ARCHIVO de la BD
const useArchiveData = () => {
    const [loading, setLoading] = useState(false);

    const fetchLastDataByGis = async (gisCode) => {
        setLoading(true);
        console.log(`Consultando BD para GIS: ${gisCode}...`);
        
        // SIMULACIÓN: Esperar 1 segundo y devolver datos fijos basados en tu imagen
        return new Promise((resolve) => {
            setTimeout(() => {
                setLoading(false);
                // Si el código es el del ejemplo, devolvemos los datos de la captura de pantalla
                if (gisCode.includes('PTO000023813')) {
                    console.log("Datos encontrados en BD.");
                    resolve({
                        success: true,
                        // Datos tomados de la primera fila de tu imagen de la tabla ARCHIVO
                        lat: '8194872.91374667', 
                        long: '220598.283518378',
                        // Fecha tomada de la imagen: 2026-01-13 17:42:59
                        date: new Date('2026-01-13T17:42:59') 
                    });
                } else {
                    console.log("No se encontraron datos previos en BD para este GIS.");
                    resolve({ success: false, lat: '', long: '', date: new Date() });
                }
            }, 1000);
        });
    };

    return { fetchLastDataByGis, loading };
};
