import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown'; 
import { useDatos } from '../context/DatosContext';
import api from '../api/apiConfig'; 

export default function SelectorAlimentador() {
  const { 
    feeders, setFeeders,          
    selectedFeeder, setSelectedFeeder 
  } = useDatos();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si ya tenemos datos, no recargar
    if (feeders.length > 0) return;

    const loadFeeders = async () => {
      setLoading(true);
      try {
        console.log("📡 Cargando alimentadores...");
        const response = await api.get('/Feeder/GetFeeder'); 
        
        // Validación: A veces viene en response.data o response.data.result
        let rawData = response.data;
        if (response.data && response.data.result) {
            rawData = response.data.result;
        }

        if (!Array.isArray(rawData)) return;

        // --- SOLUCIÓN DEL UNDEFINED ---
        // Basado en tu captura: usas 'alimEtiqueta' y 'alimCodigo' (minúsculas)
        const listaProcesada = rawData.map((item) => {
            return {
                ...item, // Mantenemos toda la data original
                
                // Creamos la etiqueta VISUAL combinando nombre y código
                label: `${item.alimEtiqueta} - ${item.alimCodigo}`,
                
                // Usamos 'alimInterno' como clave única
                uniqueKey: item.alimInterno 
            };
        });

        setFeeders(listaProcesada);

      } catch (error) {
        console.error("❌ Error cargando alimentadores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFeeders();
  }, [feeders, setFeeders]);

  return (
    <div className="card flex justify-content-center bg-white p-2 rounded shadow-lg">
        <Dropdown 
            value={selectedFeeder} 
            onChange={(e) => setSelectedFeeder(e.value)} 
            options={feeders} 
            
            // 👁️ ESTO ES CLAVE: Le decimos que muestre el campo 'label' que creamos arriba
            optionLabel="label" 
            
            filter 
            filterBy="label"
            placeholder="Seleccione Alimentador" 
            emptyFilterMessage="No encontrado"
            
            className="w-full md:w-14rem" 
            style={{ minWidth: '250px' }}
            disabled={loading}
        />
    </div>
  );
}