import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ⚠️ IMPORTA TU BASE DE DATOS AQUÍ
// Ejemplo: import { db } from "../../database/database"; 
// Si usas hooks para todo, necesitaremos un acceso directo o usar 'useContext'.
// Para este ejemplo, asumo que puedes importar tu instancia 'db' o usar un helper.
import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";

const APP_MEDIA_DIR = FileSystem.documentDirectory + "SigreMedios/";

export default function DailyZipScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Listo para generar reporte.");
  const { fetchDeficiencyByIdLocal } = useDeficiency();
  
  // Si tienes un hook para ejecutar SQL crudo, úsalo. Si no, ajusta esta parte.
  // Aquí simularé la lógica de "fetch" asumiendo que tienes funciones para buscar por ID.
  const { 
     // Asumiendo que tienes estos hooks o similares, si no, mira la función auxiliar abajo*
     getSedById, 
     getFeederById,
     getItemById // Un hook genérico para buscar Poste/Vano
  } = useDatos(); 

  // ==============================================================================
  // 🧠 LÓGICA SENIOR: HELPER PARA RESOLVER JERARQUÍA
  // ==============================================================================
  // Esta función es la clave. Dado un elemento, busca sus "padres" (SED y Alim).
  // Nota: Tendrás que adaptar las llamadas a tu capa de base de datos real.
  const resolveHierarchy = async (tipoElemento, idElemento, defData) => {
    let sedCodigo = "0000";
    let alimEtiqueta = "ALIM_UNK";
    let sedInterno = null;

    try {
        // PASO 1: ENCONTRAR EL 'SedInterno'
        if (tipoElemento === "SED") {
            // Si la deficiencia es del mismo SED, el ID del elemento ES el SedInterno
            sedInterno = idElemento;
        } else {
            // Si es POSTE o VANO, debemos buscar en su tabla a qué SED pertenece.
            // ⚠️ AQUÍ NECESITAS TU CONSULTA SQL REAL.
            // Ejemplo conceptual: SELECT SedInterno FROM Postes WHERE PostInterno = idElemento
            
            // Si no tienes acceso directo a SQL aquí, intentaremos inferir o usar un hook.
            // Supondré que tienes una función global o hook que te da el objeto:
            // const elemento = await fetchElemento(tipoElemento, idElemento);
            // sedInterno = elemento?.SedInterno;
            
            // *PARCHE RÁPIDO SI NO TIENES SQL A MANO:*
            // Muchas veces se guarda el SedInterno en la deficiencia por redundancia.
            // Revisa si 'defData.SedInterno' existe. Si no, es OBLIGATORIO hacer la query al Elemento.
            if (defData.SedInterno) {
                sedInterno = defData.SedInterno;
            } else {
                console.warn("⚠️ Faltan joins para obtener SedInterno de Poste/Vano. Usando '0000'");
                // AQUÍ DEBERÍAS HACER: const res = await db.executeSql(`SELECT SedInterno FROM ${tipoElemento}s WHERE ...`);
            }
        }

        // PASO 2: BUSCAR DATOS DEL SED (Código y AlimInterno)
        let alimInterno = null;
        if (sedInterno) {
             // ⚠️ Query: SELECT SedCodigo, AlimInterno FROM SED WHERE SedInterno = ?
             // Simulación con tu hook o función existente:
             // const sedData = await getSedById(sedInterno);
             // sedCodigo = sedData?.SedCodigo;
             // alimInterno = sedData?.AlimInterno;
             
             // Si no puedes hacer la query, el ZIP saldrá con 0000.
             // Necesitas implementar esta búsqueda en tus hooks.
        }

        // PASO 3: BUSCAR ALIMENTADOR
        if (alimInterno) {
             // ⚠️ Query: SELECT AlimEtiqueta FROM Alimentadores WHERE AlimInterno = ?
             // const alimData = await getFeederById(alimInterno);
             // alimEtiqueta = alimData?.AlimEtiqueta;
        }

    } catch (e) {
        console.error("Error resolviendo jerarquía:", e);
    }

    return { sedCodigo, alimEtiqueta };
  };

  // ==============================================================================
  // 🚀 GENERADOR ZIP
  // ==============================================================================
  const generarZipDiario = async () => {
    setLoading(true);
    setStatus("Iniciando escaneo...");

    try {
      const dirInfo = await FileSystem.getInfoAsync(APP_MEDIA_DIR);
      if (!dirInfo.exists) return Alert.alert("Error", "Carpeta vacía");

      const files = await FileSystem.readDirectoryAsync(APP_MEDIA_DIR);
      const todayString = new Date().toISOString().split('T')[0];
      const archivosDelDia = [];

      // 1. FILTRADO
      for (const file of files) {
        const info = await FileSystem.getInfoAsync(APP_MEDIA_DIR + file);
        const fileDate = new Date(info.modificationTime * 1000).toISOString().split('T')[0];
        if (fileDate === todayString && !file.includes("DELETED")) {
          archivosDelDia.push(file);
        }
      }

      if (archivosDelDia.length === 0) {
        setLoading(false);
        return Alert.alert("Aviso", "No hay fotos de hoy.");
      }

      setStatus(`Procesando ${archivosDelDia.length} archivos...`);
      const zip = new JSZip();

      // 2. PROCESAMIENTO UNO A UNO
      for (const filename of archivosDelDia) {
        // A. Extraer ID Deficiencia
        let defiInterno = null;
        const parts = filename.split('_');
        const defIndex = parts.indexOf('DEF');
        if (defIndex !== -1 && parts[defIndex + 1]) defiInterno = parts[defIndex + 1];

        let folderPath = "Sin_Data";

        if (defiInterno) {
            // B. Obtener Datos de la Deficiencia
            const defData = await fetchDeficiencyByIdLocal(defiInterno);

            if (defData) {
                // Datos directos de la tabla Deficiencias
                const tipoElem = defData.DefiTipoElemento === "POST" ? "Poste" : (defData.DefiTipoElemento === "VANO" ? "Vano" : "SED");
                const codElem = defData.DefiCodigoElemento || "S_C";
                const codDef = defData.DefiCodDef;
                
                // C. RESOLVER ALIMENTADOR Y SED (La parte difícil)
                // -----------------------------------------------------------
                // IMPORTANTE: Como no tengo tu código de conexión DB aquí, he puesto la lógica
                // dentro de este bloque simulado. DEBES REEMPLAZARLO con tus llamadas reales.
                
                // INTENTO 1: Buscar si tienes los datos 'cacheados' en columnas extras (desnormalización)
                let { SedCodigo, AlimEtiqueta } = defData; // A veces se guardan copia

                // INTENTO 2: Si son nulos, usar IDs para buscar (LO CORRECTO)
                if (!SedCodigo || !AlimEtiqueta) {
                    // Aquí es donde DEBES llamar a tu DB. 
                    // Como parche, si no tienes la query lista, saldrá UNK.
                    // Para que salga bien, necesito que uses tu 'useFeeder' o similar aquí dentro.
                    
                    // Ejemplo Ficticio Funcional:
                    // const fullHierarchy = await getFullHierarchy(defData.DefiIdElemento, defData.DefiTipoElemento);
                    // SedCodigo = fullHierarchy.sed;
                    // AlimEtiqueta = fullHierarchy.alim;
                    
                    // Valores por defecto para que no falle el ZIP mientras conectas la DB:
                    SedCodigo = SedCodigo || "0000";
                    AlimEtiqueta = AlimEtiqueta || "ALIM_UNK"; 
                }
                // -----------------------------------------------------------

                // D. Construir Ruta Base
                // SigreMovil / CHACHANI / 1709 / Vano / V_123 / 1050
                folderPath = `SigreMovil/${AlimEtiqueta}/${SedCodigo}/${tipoElem}/${codElem}/${defiInterno}`;

                // E. REGLA DE NEGOCIO: CÓDIGO 7004 (Suministros)
                if (String(codDef) === "7004" && tipoElem === "Vano") {
                    const numSum = defData.DefiNumSuministro || "000"; //
                    folderPath += `/Suministro_${numSum}`;
                }
            }
        }

        // F. Agregar al ZIP
        const fileUri = APP_MEDIA_DIR + filename;
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        zip.folder(folderPath).file(filename, base64, { base64: true });
      }

      setStatus("Comprimiendo...");
      const zipBase64 = await zip.generateAsync({ type: "base64" });
      const zipUri = FileSystem.cacheDirectory + `Reporte_${todayString}.zip`;
      await FileSystem.writeAsStringAsync(zipUri, zipBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipUri);
      }

    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setStatus("Listo.");
    }
  };

  return (
    <View style={styles.container}>
       {/* ... (MISMO DISEÑO UI QUE ANTES) ... */}
       <View style={styles.card}>
        <Ionicons name="folder-open-outline" size={60} color="#2563EB" />
        <Text style={styles.title}>Reporte Estructurado</Text>
        <Text style={{textAlign:'center', color:'#666', marginVertical:10}}>
             Genera ZIP con carpetas: Alim / SED / Elemento
        </Text>
        <Text style={{textAlign:'center', color:'#f00', fontSize:10, marginBottom:10}}>
             {status}
        </Text>
        
        <TouchableOpacity 
            style={[styles.button, loading && {backgroundColor:'#999'}]} 
            onPress={generarZipDiario} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>DESCARGAR HOY</Text>}
        </TouchableOpacity>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f4' },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 20, width: '90%', alignItems: 'center', elevation: 5 },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 10, width: '100%', marginTop: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' }
});