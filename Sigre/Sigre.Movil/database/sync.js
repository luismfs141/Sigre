import { api } from "../config";
import { executeSql } from "./helpers";
import { insertDeficiency } from "./schema";

const client = api();

export const syncDeficiencies = async (feeders) => {
  try {
    // 1️⃣ Llamar a tu endpoint con los feeders
    const res = await client.post("GetDeficienciesByFeeders", feeders);
    const deficiencies = res.data;

    console.log(`✅ Descargadas ${deficiencies.length} deficiencias`);

    // 2️⃣ Insertar o actualizar cada registro en SQLite
    for (let defi of deficiencies) {
      const values = [
        defi.defiInterno,
        defi.defiEstado,
        defi.tablInterno,
        defi.defiCodigoElemento,
        defi.tipiInterno,
        defi.defiNumSuministro,
        defi.defiFechaDenuncia,
        defi.defiFechaInspeccion,
        defi.defiFechaSubsanacion,
        defi.defiObservacion,
        defi.defiEstadoSubsanacion,
        defi.defiLatitud,
        defi.defiLongitud,
        defi.defiTipoElemento,
        defi.defiDistHorizontal,
        defi.defiDistVertical,
        defi.defiDistTransversal,
        defi.defiIdElemento,
        defi.defiFecRegistro,
        defi.defiCodDef,
        defi.defiCodAmt,
        defi.defiFecModificacion,
        defi.defiFechaCreacion,
        defi.defiPozoTierra,
        defi.defiResponsable ? 1 : 0,
        defi.defiComentario,
        defi.defiPozoTierra2,
        defi.defiUsuarioInic,
        defi.defiUsuarioMod,
        defi.defiActivo ? 1 : 0,
        defi.defiEstadoCriticidad,
        defi.defiInspeccionado ? 1 : 0,
        defi.defiCol1,
        defi.defiCol2,
        defi.defiCol3,
        0, // pendingSync
        new Date().toISOString() // lastModified
      ];

      await executeSql(insertDeficiency, values);
    }

    console.log("🧩 Sincronización completada correctamente");

  } catch (error) {
    console.error("❌ Error al sincronizar deficiencias:", error);
  }
};