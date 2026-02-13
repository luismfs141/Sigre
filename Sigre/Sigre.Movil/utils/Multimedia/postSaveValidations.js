import { Platform } from "react-native";
import { PUBLIC_TRASH_DIR_NAME, REQUIRED_PHOTO_TYPES } from "./constants";
import { isPhotoArchTipo } from "./mediaUtils";
import { basenameFromAnyPath } from "./pathUtils";
import { ensureSafPath, SAF, safDisplayName, safNameMatches, writeFileIntoSafDir } from "./safUtils";

export async function runPostSaveValidations({
  canGeneratePlaceholders,
  isElevated,
  selectedDeficiencyId,

  fetchMediosByDeficienciaId,
  markArchivoAsInactive,
  setDefiInspeccionadoLocal,
  recalcularPinInspeccionadoParaElemento,

  picturesRoot,
  picturesTargetDir,
  pathSegments,
  deficiencyData,
  photosSnapshot,
}) {
  const report = {
    desactivadosPorFaltaPublica: 0,
    orfanasMovidasEliminados: 0,
    placeholdersOmitidos: 0,
    placeholdersEnPantalla: 0,
    defiInspeccionadoPrevio: Number(deficiencyData?.DefiInspeccionado) ? 1 : 0,
    defiInspeccionadoNuevo: Number(deficiencyData?.DefiInspeccionado) ? 1 : 0,
    pinPrevio: null,
    pinNuevo: null,
    pinActualizado: false,
    tablaActualizada: null,
    pudoVerificarCarpetaPublica: false,
  };

  report.placeholdersEnPantalla =
    canGeneratePlaceholders ? (photosSnapshot?.filter((p) => p?.isPlaceholder)?.length ?? 0) : 0;

  const placeholderIds = new Set(
    isElevated
      ? (photosSnapshot ?? [])
          .filter((p) => p?.isPlaceholder && p?.id)
          .map((p) => p.id)
      : []
  );

  const idBusquedaValidacion =
    (deficiencyData?.DefiServerId && deficiencyData.DefiServerId > 0)
      ? deficiencyData.DefiServerId
      : deficiencyData?.DefiInterno ?? selectedDeficiencyId;

  const activos = (await fetchMediosByDeficienciaId(idBusquedaValidacion)) ?? [];
  const fotosActivas = activos.filter((a) => isPhotoArchTipo(a?.ArchTipo));

  let publicUris = [];
  if (Platform.OS === "android" && picturesRoot && picturesTargetDir) {
    try {
      publicUris = (await SAF.readDirectoryAsync(picturesTargetDir)) ?? [];
      report.pudoVerificarCarpetaPublica = true;
    } catch (e) {
      console.warn("⚠️ No se pudo leer carpeta pública para validaciones:", e);
    }
  }

  const safHasFileName = (uris = [], fileName = "") => {
    if (!fileName) return false;
    return uris.some((u) => safNameMatches(u, fileName));
  };

  const desactivadosIds = new Set();
  const expectedNames = fotosActivas
    .map((a) => basenameFromAnyPath(a?.ArchNombre))
    .filter(Boolean);

  if (report.pudoVerificarCarpetaPublica) {
    // 1) BD ↔ pública
    for (const a of fotosActivas) {
      const archInterno = a?.ArchInterno;
      const nombre = basenameFromAnyPath(a?.ArchNombre);
      if (!nombre || !archInterno) continue;

      if (isElevated && placeholderIds.has(archInterno)) {
        report.placeholdersOmitidos += 1;
        continue;
      }

      if (!safHasFileName(publicUris, nombre)) {
        const ok = await markArchivoAsInactive(archInterno);
        if (ok) {
          report.desactivadosPorFaltaPublica += 1;
          desactivadosIds.add(archInterno);
        }
      }
    }

    // 1b) huérfanas → ELIMINADOS
    const trashSegments = [PUBLIC_TRASH_DIR_NAME, ...pathSegments.slice(1)];
    let picturesTrashDir = null;

    for (const uri of publicUris) {
      const nombre = safDisplayName(uri);
      if (!nombre) continue;

      const nLower = String(nombre).toLowerCase();
      const pareceFoto =
        /\.(jpg|jpeg|png)$/i.test(nombre) || nLower.startsWith("fot-") || nLower.startsWith("img-");

      if (!pareceFoto) continue;

      const isExpected = expectedNames.some((fn) => safNameMatches(uri, fn));

      if (!isExpected) {
        try {
          if (!picturesTrashDir) {
            picturesTrashDir = await ensureSafPath(picturesRoot, trashSegments);
          }

          await writeFileIntoSafDir({
            dirUri: picturesTrashDir,
            fileName: nombre,
            mimeType: "image/jpeg",
            sourceFileUri: uri,
          });

          await SAF.deleteAsync(uri);
          report.orfanasMovidasEliminados += 1;
        } catch (e) {
          console.warn("⚠️ No se pudo mover huérfana a ELIMINADOS:", e);
        }
      }
    }
  }

  // 2) DefiInspeccionado por fotos 1..4
  const presentes = new Set();

  for (const a of fotosActivas) {
    const archInterno = a?.ArchInterno;
    const tipo = Number(a?.ArchTipo);
    const nombre = basenameFromAnyPath(a?.ArchNombre);

    if (!REQUIRED_PHOTO_TYPES.includes(tipo)) continue;
    if (desactivadosIds.has(archInterno)) continue;

    if (isElevated && placeholderIds.has(archInterno)) {
      presentes.add(tipo);
      continue;
    }

    if (report.pudoVerificarCarpetaPublica) {
      if (safHasFileName(publicUris, nombre)) presentes.add(tipo);
    } else {
      presentes.add(tipo);
    }
  }

  const cumple = REQUIRED_PHOTO_TYPES.every((t) => presentes.has(t));
  report.defiInspeccionadoNuevo = cumple ? 1 : 0;

  if (report.defiInspeccionadoNuevo !== report.defiInspeccionadoPrevio) {
    await setDefiInspeccionadoLocal(selectedDeficiencyId, report.defiInspeccionadoNuevo);
  }

  // 3) Recalcular pin del elemento
  const tipoElem = String(deficiencyData?.DefiTipoElemento ?? "").trim().toUpperCase();

  if (tipoElem === "POST" || tipoElem === "VANO") {
    const res = await recalcularPinInspeccionadoParaElemento(
      deficiencyData?.DefiIdElemento,
      tipoElem
    );

    report.pinPrevio = res?.previo ?? null;
    report.pinNuevo = res?.nuevo ?? null;
    report.pinActualizado = res?.ok ?? false;
    report.tablaActualizada =
      res?.tablaActualizada ??
      (tipoElem === "VANO" ? "Vanos.VanoInspeccionado" : "Pines.Inspeccionado");
  }

  // 4) Mensaje
  const checks = [];
  const details = [];
  const notes = [];

  if (Platform.OS === "android") {
    if (report.pudoVerificarCarpetaPublica) {
      checks.push("✅ Verificación de carpeta pública: OK");
    } else {
      checks.push("⚠️ Verificación de carpeta pública: NO DISPONIBLE");
      notes.push("No se pudo acceder a la carpeta pública (SAF). Se aplicó una verificación parcial (fallback).");
    }
  }

  details.push(`• Registros desactivados por falta de archivo en pública: ${report.desactivadosPorFaltaPublica}`);
  details.push(`• Fotos huérfanas movidas a ELIMINADOS: ${report.orfanasMovidasEliminados}`);

  if (canGeneratePlaceholders) {
    details.push(`• Placeholders en pantalla: ${report.placeholdersEnPantalla}`);
    if (isElevated) {
      details.push(`• Placeholders omitidos en validación: ${report.placeholdersOmitidos}`);
      notes.push("Admin/Supervisor: los placeholders pueden contar como evidencia visual para evitar falsos negativos.");
    } else {
      notes.push("Inspector: los placeholders son informativos y NO reemplazan la foto real. Si aparece uno, reemplaza la foto.");
    }
  }

  const inspeccionTxt =
    report.defiInspeccionadoNuevo === 1
      ? "✅ Inspección COMPLETA (fotos obligatorias 1–4 presentes)"
      : "⚠️ Inspección INCOMPLETA (falta alguna foto obligatoria 1–4)";

  checks.push(inspeccionTxt);
  details.push(`• DefiInspeccionado: ${report.defiInspeccionadoPrevio} → ${report.defiInspeccionadoNuevo}`);

  if (tipoElem === "POST" || tipoElem === "VANO") {
    const label = tipoElem === "VANO" ? "Vano" : "Poste";
    if (report.pinActualizado) {
      checks.push(`✅ Estado del elemento (${label}) actualizado`);
      details.push(`• ${report.tablaActualizada}: ${report.pinPrevio} → ${report.pinNuevo}`);
    } else {
      checks.push(`⚠️ Estado del elemento (${label}) no se pudo actualizar`);
      notes.push("No se pudo recalcular el estado del elemento. Revisa ID y tabla (Pines/Vanos).");
    }
  }

  const bodyParts = [];
  bodyParts.push("📌 RESULTADO DE VERIFICACIÓN");
  bodyParts.push(checks.join("\n"));
  bodyParts.push("\n📷 CONSISTENCIA DE FOTOS");
  bodyParts.push(details.join("\n"));

  if (notes.length > 0) {
    bodyParts.push("\n📝 NOTAS");
    bodyParts.push(notes.map((n) => `• ${n}`).join("\n"));
  }

  const resumen = bodyParts.join("\n");

  let titulo = "✅ Guardado exitoso";
  if (report.desactivadosPorFaltaPublica > 0 || report.orfanasMovidasEliminados > 0) {
    titulo = "⚠️ Guardado con correcciones";
  } else if (!report.pudoVerificarCarpetaPublica && Platform.OS === "android") {
    titulo = "✅ Guardado (con observaciones)";
  }

  return { ...report, titulo, resumen };
}
