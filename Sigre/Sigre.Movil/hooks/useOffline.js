import { useState } from "react";
import { api } from "../config"; // tu instancia de axios
import { executeSql, initTables } from "../database/helpers";
import { createDeficienciesTable, insertDeficiency } from "../database/schema";

export const useOffline = () => {
  const [loading, setLoading] = useState(false);
  const client = api();

  // 🏗️ 1. Crear la tabla Deficiencias en SQLite
  const setupDatabase = async () => {
    setLoading(true);
    try {
      await initTables([createDeficienciesTable]);
      alert("Tabla Deficiencias inicializada correctamente");
    } catch (error) {
      console.error("❌ Error al crear la tabla Deficiencias:", error);
      alert("Hubo un error al crear la tabla Deficiencias");
    } finally {
      setLoading(false);
    }
  };

  // ⬇️ 2. Descargar deficiencias desde el backend y guardarlas en SQLite
  const downloadDeficiencies = async (feeders = []) => {
    setLoading(true);
    try {
      // Endpoint POST con lista de feeders
      const endpoint = "/api/Deficiencies/GetDeficienciesByFeeders";

      const res = await client.post(endpoint, feeders);
      const data = res.data;

      if (!Array.isArray(data)) {
        throw new Error("El servidor no devolvió una lista válida de deficiencias");
      }

      // Limpiar datos antiguos (opcional)
      await executeSql("DELETE FROM Deficiencias");

      // Insertar fila por fila
      for (const row of data) {
        const values = [
          row.defiInterno,
          row.defiEstado,
          row.tablInterno,
          row.defiCodigoElemento,
          row.tipiInterno,
          row.defiNumSuministro,
          row.defiFechaDenuncia,
          row.defiFechaInspeccion,
          row.defiFechaSubsanacion,
          row.defiObservacion,
          row.defiEstadoSubsanacion,
          row.defiLatitud,
          row.defiLongitud,
          row.defiTipoElemento,
          row.defiDistHorizontal,
          row.defiDistVertical,
          row.defiDistTransversal,
          row.defiIdElemento,
          row.defiFecRegistro,
          row.defiCodDef,
          row.defiCodAmt,
          row.defiFecModificacion,
          row.defiFechaCreacion,
          row.defiPozoTierra,
          row.defiResponsable ? 1 : 0,
          row.defiComentario,
          row.defiPozoTierra2,
          row.defiUsuarioInic,
          row.defiUsuarioMod,
          row.defiActivo ? 1 : 0,
          row.defiEstadoCriticidad,
          row.defiInspeccionado ? 1 : 0,
          row.defiCol1,
          row.defiCol2,
          row.defiCol3,
          0, // pendingSync
          new Date().toISOString(), // lastModified
        ];

        await executeSql(insertDeficiency, values);
      }

      alert(`✅ ${data.length} deficiencias descargadas correctamente`);
    } catch (error) {
      console.error("❌ Error al descargar deficiencias:", error);
      alert("Hubo un error al descargar las deficiencias");
    } finally {
      setLoading(false);
    }
  };

  // 📦 3. Obtener deficiencias guardadas localmente
  const getLocalDeficiencies = async () => {
    try {
      const result = await executeSql("SELECT * FROM Deficiencias");
      const rows = [];
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(result.rows.item(i));
      }
      return rows;
    } catch (error) {
      console.error("❌ Error al obtener deficiencias locales:", error);
      return [];
    }
  };

  return {
    loading,
    setupDatabase,
    downloadDeficiencies,
    getLocalDeficiencies,
  };
};