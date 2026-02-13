import { useState } from 'react';
import api from '../api/apiConfig';

export const useElement = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createElement = async (formData, selectedFeeder, selectedSed) => {
        setLoading(true);
        setError(null);
        
        try {
            // 1. Validaciones previas básicas
            if (!selectedFeeder) throw new Error("El Alimentador es obligatorio");
            if (!formData.etiqueta) throw new Error("La etiqueta es obligatoria");

            // 2. Extraer IDs de forma segura
            const feederId = (selectedFeeder && typeof selectedFeeder === 'object') ? selectedFeeder.value : selectedFeeder;
            const sedId = (selectedSed && typeof selectedSed === 'object') ? selectedSed.value : selectedSed;

            // 3. Determinar Tipo
            const isPoste = formData.tipoElemento === 'POST';
            
            // IMPORTANTE: Ajusta estos endpoints a como se llamen en tu Controller C#
            const endpoint = isPoste ? '/Post/GuardarPosteWeb' : '/Gap/GuardarVanoWeb'; 

            // 4. Construir Payload (Backend Pasivo: El Front manda todo)
            let payload = {};

            if (isPoste) {
                payload = {
                    // --- Identificación ---
                    PostInterno: 0, // 0 = Crear Nuevo
                    PostEtiqueta: formData.etiqueta,
                    PostCodigoNodo: formData.codigo,
                    
                    // --- Ubicación y Red ---
                    PostLatitud: formData.latitud,
                    PostLongitud: formData.longitud,
                    AlimInterno: feederId,
                    PostSubestacion: sedId, // Puede ser null

                    // --- Características (Usuario) ---
                    
                    PostMaterial: formData.materialPoste, // ID del material
                    PostAltura: formData.altura,
                    PostRetenidaTipo: formData.idRetenida || 5, // 5 = Sin retenida (o el default que uses)

                    // --- Valores Técnicos (Defaults) ---
                    PostTerceros: false,
                    PostEsBT: true,
                    PostInspeccionado: false,
                    PostEsMt: null,
                    PostRetenidaMaterial: null,
                    PostArmadoTipo: null,
                    PostArmadoMaterial: null,
                    PostTramo: null
                };
            } else {
                payload = {
                    // --- Identificación ---
                    VanoInterno: 0, // 0 = Crear Nuevo
                    VanoEtiqueta: formData.etiqueta,
                    VanoCodigo: formData.codigo,
                    AlimInterno: feederId,
                    VanoSubestacion: sedId,

                    // --- Geometría ---
                    VanoLatitudIni: formData.latitudIni,
                    VanoLongitudIni: formData.longitudIni,
                    VanoLatitudFin: formData.latitudFin,
                    VanoLongitudFin: formData.longitudFin,

                    // --- Características (Usuario) ---
                    
                    
                    
                    // --- Topología ---
                    VanoNodoInicial: formData.nodoInicial,
                    VanoNodoFinal: formData.nodoFinal,

                    // --- Valores Técnicos ---
                    VanoEsBT: true,
                    VanoTerceros: false,
                    VanoInspeccionado: false,
                    VanoEsMt: null,
                    VanoMaterial: null,
                };
            }

            console.log("🚀 Enviando Payload:", payload);
            
            const response = await api.post(endpoint, payload);
            return response.data; // Retorna el ID generado

        } catch (err) {
            console.error("❌ Error en useElement:", err);
            
            // Lógica para extraer el mensaje exacto del Backend (.NET)
            let mensajeError = "Error al guardar el elemento.";
            
            if (err.response && err.response.data) {
                // Si el backend mandó { mensaje: "...", detalleTecnico: "..." }
                if (err.response.data.detalleTecnico) {
                    mensajeError = err.response.data.detalleTecnico;
                } else if (err.response.data.mensaje) {
                    mensajeError = err.response.data.mensaje;
                } else if (err.response.data.errors) {
                    // Errores de validación automáticos de .NET (ej: campos requeridos)
                    mensajeError = JSON.stringify(err.response.data.errors);
                }
            } else if (err.message) {
                mensajeError = err.message;
            }

            // Guardamos el error formateado en el estado
            setError(mensajeError);
            
            // Lanzamos el error formateado para que el componente lo muestre en el alert
            throw new Error(mensajeError);
            
        } finally {
            setLoading(false);
        }
    };

    return { createElement, loading, error };
};