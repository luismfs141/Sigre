import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";

import { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";
import { useFiles } from "../../hooks/useFiles";

import { formatLocalISO, getUniqueNowMs, nowPeruISO, roundMsForSqlDatetime } from "../../utils/dateUtils";



import AudioCard from "../../components/Multimedia/AudioCard";
import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";
import PhotoCard from "../../components/Multimedia/PhotoCard";

import ViewShot from "react-native-view-shot";
import PhotoModal from "../../components/Modal/PhotoModal";

import { styles } from "../../styles/MultimediaStyles";



console.log("✅ STYLES KEYS:", Object.keys(styles || {}));


import {
  KEY_MUSIC_DIR,
  KEY_PICTURES_DIR,
  PHOTO_SLOTS,
  PLACEHOLDER_PREFIX
} from "../../utils/Multimedia/constants";

import { ensureDirExists } from "../../utils/Multimedia/fsUtils";

import {
  basenameFromAnyPath,
  buildMediaName,
  cleanUri,
  getDirFromRelative,
  getStampPartsFromMs,
  normalizeRelativePath,
  safeSeg,
  toTrashRelativePath,
} from "../../utils/Multimedia/pathUtils";


import { isPhotoArchTipo } from "../../utils/Multimedia/mediaUtils";

import {
  PLACEHOLDER_DIR,
  buildPlaceholderLines,
  buildPlaceholderTargetUri,
} from "../../utils/Multimedia/placeholderUtils";

import {
  extract7004IndexFromPath,
  getNext7004Correlativo,
} from "../../utils/Multimedia/correlativo7004";

import {
  SAF,
  ensureSafPath,
  getOrRequestPublicDir,
  safDirForRelativeFile,
  safDirForRelativeFileReadOnly,
  safNameMatches,
  safTrashDirForRelativeFile,
  writeFileIntoSafDir
} from "../../utils/Multimedia/safUtils";

import { runPostSaveValidations } from "../../utils/Multimedia/postSaveValidations";

export default function Multimedia() {
  const router = useRouter();
  const replaceTargetRef = useRef(null);

  const {
    selectedItem,
    selectedSed,
    selectedDeficiency,
    isAdmin = false,
    isSupervisor = false,
    isInspector = false,
    currentUserId,
    dbName,
    dbReady,
    alimEtiquetaLocal
  } = useDatos();

  const isElevated = isAdmin || isSupervisor;
  const canGeneratePlaceholders = isAdmin || isSupervisor || isInspector;

  //const { findFeederById } = useFeeder();
  const { saveArchivoLocal, fetchMediosByDeficienciaId, markArchivoAsDeleted, markArchivoAsInactive } = useFiles();

  const { fetchDeficiencyByIdLocal, setDefiInspeccionadoLocal, recalcularPinInspeccionadoParaElemento } = useDeficiency();

  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);
  const [loading, setLoading] = useState({ active: false, msg: "" });
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(null);

  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [audios, setAudios] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);

  const [placeholderQueue, setPlaceholderQueue] = useState([]);
  const [pendingOriginalSnapshot, setPendingOriginalSnapshot] = useState(false);
  const placeholderShotRef = useRef(null);
  const currentPlaceholderJob = placeholderQueue?.[0] ?? null;

  const [originalPhotos, setOriginalPhotos] = useState(Array(6).fill(null));
  const [originalAudios, setOriginalAudios] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  const [replaceTarget, setReplaceTarget] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);

  const [defOwnerId, setDefOwnerId] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log("👤 PERFIL:", { dbReady, dbName, isAdmin, isSupervisor, isInspector, currentUserId, canEdit, defOwnerId });
    }, [dbReady, dbName, isAdmin, isSupervisor, isInspector, currentUserId, canEdit, defOwnerId])
  );

  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;

    setLoading({ active: true, msg: "Cargando..." });
    setDeletedIds([]);

    try {
      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);

      const ownerId = deficiencia?.DefiUsuarioInic ?? null;
      setDefOwnerId(ownerId);

      const isOwner =
        ownerId != null &&
        currentUserId != null &&
        Number(ownerId) === Number(currentUserId);

      const _canEdit = isElevated || (isInspector && isOwner);
      setCanEdit(_canEdit);

      const idBusqueda =
        deficiencia.DefiServerId && deficiencia.DefiServerId > 0
          ? deficiencia.DefiServerId
          : deficiencia.DefiInterno;

      const medios = await fetchMediosByDeficienciaId(idBusqueda);
      const activos = (medios ?? []).filter((m) => Number(m.ArchActivo) === 1);

      const hasAnyPhoto = activos.some((m) => isPhotoArchTipo(m?.ArchTipo));
      const hasAnyAudio = activos.some((m) => Number(m?.ArchTipo) === 0);

      let picturesRoot = null;
      let musicRoot = null;

      if (Platform.OS === "android") {
        if (hasAnyPhoto) picturesRoot = await getOrRequestPublicDir("Pictures", KEY_PICTURES_DIR);
        if (hasAnyAudio) musicRoot = await getOrRequestPublicDir("Music", KEY_MUSIC_DIR);
      }

      const photosTmp = Array(6).fill(null);
      const audiosTmp = [];
      const placeholderJobs = [];

      const dirCache = new Map();

      const listDirCached = async (dirUri) => {
        if (!dirUri) return [];
        if (dirCache.has(dirUri)) return dirCache.get(dirUri);
        try {
          const children = (await SAF.readDirectoryAsync(dirUri)) ?? [];
          dirCache.set(dirUri, children);
          return children;
        } catch {
          dirCache.set(dirUri, []);
          return [];
        }
      };

      const resolvePublicUri = async (rootUri, archNombre) => {
        if (Platform.OS !== "android" || !rootUri) return null;

        const rel = normalizeRelativePath(archNombre);
        const fileName = basenameFromAnyPath(rel);
        if (!fileName) return null;

        const dirUri = await safDirForRelativeFileReadOnly(rootUri, rel);
        if (!dirUri) return null;

        const children = await listDirCached(dirUri);
        return children.find((u) => safNameMatches(u, fileName)) ?? null;
      };

      for (const m of activos) {
        const tipo = Number(m.ArchTipo);
        const isPhotoSlot = tipo > 0 && tipo <= 6;

        if (tipo === 0) {
          const publicUri = await resolvePublicUri(musicRoot, m.ArchNombre);

          if (publicUri) {
            audiosTmp.push({
              uri: publicUri,
              title: "Audio",
              id: m.ArchInterno,
              type: 0,
              originalPath: m.ArchNombre,
              fechaISO: m.ArchFecha, // ✅ importante
            });

          } else if (canGeneratePlaceholders) {
            audiosTmp.push({
              uri: null,
              title: "🎙️ AUDIO NO DISPONIBLE EN ESTE DISPOSITIVO",
              id: m.ArchInterno,
              type: 0,
              originalPath: m.ArchNombre,
              isPlaceholder: true,
              fechaISO: m.ArchFecha, // ✅
            });

          }
          continue;
        }

        if (isPhotoSlot) {
          const publicUri = await resolvePublicUri(picturesRoot, m.ArchNombre);

          if (publicUri) {
            photosTmp[tipo - 1] = {
              uri: publicUri,
              latUtm: m.ArchLatitud,
              lonUtm: m.ArchLongitud,
              fechaISO: m.ArchFecha,
              id: m.ArchInterno,
              originalPath: m.ArchNombre,
              type: tipo,
            };
            continue;
          }

          if (canGeneratePlaceholders) {
            const targetUri = buildPlaceholderTargetUri(m);
            const cacheBuster = `?t=${Date.now()}`;

            photosTmp[tipo - 1] = {
              uri: targetUri + cacheBuster,
              id: m.ArchInterno,
              originalPath: m.ArchNombre,
              type: tipo,
              isPlaceholder: true,
              placeholderUri: targetUri,
              latUtm: m.ArchLatitud,
              lonUtm: m.ArchLongitud,
              fechaISO: m.ArchFecha,
            };

            try {
              const pInfo = await FileSystem.getInfoAsync(targetUri);
              if (!pInfo.exists) {
                placeholderJobs.push({
                  key: String(m.ArchInterno),
                  index: tipo - 1,
                  arch: m,
                  targetUri,
                });
              }
            } catch {
              placeholderJobs.push({
                key: String(m.ArchInterno),
                index: tipo - 1,
                arch: m,
                targetUri,
              });
            }
          }
        }
      }

      setPhotos(photosTmp);
      setAudios(audiosTmp);

      setOriginalPhotos(photosTmp);
      setOriginalAudios(audiosTmp);

      setDeletedIds([]);
      setIsDirty(false);

      setPlaceholderQueue(placeholderJobs);
      setPendingOriginalSnapshot(placeholderJobs.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading({ active: false, msg: "" });
    }
  };

  useEffect(() => {
    if (!currentPlaceholderJob) return;

    let cancelled = false;

    (async () => {
      try {
        await ensureDirExists(PLACEHOLDER_DIR);
        await new Promise((r) => setTimeout(r, 50));

        const tmpUri = await placeholderShotRef.current?.capture?.({
          format: "jpg",
          quality: 0.9,
          result: "tmpfile"
        });

        if (cancelled || !tmpUri) return;

        const info = await FileSystem.getInfoAsync(currentPlaceholderJob.targetUri);
        if (!info.exists) {
          await FileSystem.moveAsync({ from: tmpUri, to: currentPlaceholderJob.targetUri });
        } else {
          await FileSystem.deleteAsync(tmpUri, { idempotent: true });
        }

        const cacheBuster = `?t=${Date.now()}`;

        setPhotos((prev) => {
          const c = [...prev];
          const idx = currentPlaceholderJob.index;

          c[idx] = {
            ...(c[idx] || {}),
            uri: currentPlaceholderJob.targetUri + cacheBuster,
            id: currentPlaceholderJob.arch.ArchInterno,
            originalPath: currentPlaceholderJob.arch.ArchNombre,
            type: Number(currentPlaceholderJob.arch.ArchTipo),
            isPlaceholder: true,
            placeholderUri: currentPlaceholderJob.targetUri,
            latUtm: currentPlaceholderJob.arch.ArchLatitud,
            lonUtm: currentPlaceholderJob.arch.ArchLongitud,
            fechaISO: currentPlaceholderJob.arch.ArchFecha
          };

          return c;
        });
      } catch (e) {
        console.warn("[PLACEHOLDER] error generando placeholder:", e?.message ?? e);
      } finally {
        if (!cancelled) {
          setPlaceholderQueue((prev) => prev.slice(1));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [currentPlaceholderJob?.key]);

  useEffect(() => {
    if (!pendingOriginalSnapshot) return;
    if ((placeholderQueue?.length ?? 0) > 0) return;

    setOriginalPhotos(photos);
    setOriginalAudios(audios);
    setPendingOriginalSnapshot(false);
  }, [pendingOriginalSnapshot, placeholderQueue?.length, photos, audios]);

  const getElementoInfo = () => {
    if (selectedItem?.PostInterno) return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    const vanoCode = selectedItem?.Vano_Codigo || selectedItem?.VanoCodigo;
    if (vanoCode) return { tipo: "Vano", codigo: vanoCode };
    return { tipo: "Elemento", codigo: "UNK" };
  };

  const showNoPermAlert = () => {
    const owner = defOwnerId != null ? String(defOwnerId) : "DESCONOCIDO";
    Alert.alert(
      "Solo lectura",
      `No puedes modificar esta evidencia.\n\n` +
      `• Creador (DefiUsuarioInic): ${owner}\n` +
      `• Tu usuario (UsuaInterno): ${currentUserId ?? "?"}\n\n` +
      `Solo el creador o un Administrador/Supervisor puede editar.`
    );
  };

  const requireEditPermission = () => {
    if (canEdit) return true;
    showNoPermAlert();
    return false;
  };

  const handleDeletePhoto = async (index) => {
    const photo = photos[index];
    if (!photo) return;
    if (!requireEditPermission()) return;

    if (photo?.id) {
      setDeletedIds((prev) => [
        ...prev,
        {
          id: photo.id,
          path: photo.originalPath,
          type: photo.type,
          sourceUri: photo?.isPlaceholder ? cleanUri(photo.uri) : undefined,
          isPlaceholder: !!photo?.isPlaceholder
        }
      ]);
    } else {
      try {
        const u = cleanUri(photo.uri);
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    setPhotos((prev) => {
      const c = [...prev];
      c[index] = null;
      return c;
    });
    setIsDirty(true);
  };

  const handleDeleteAudio = async (index) => {
    const audio = audios[index];
    if (!audio) return;
    if (!requireEditPermission()) return;

    if (audio?.id) {
      setDeletedIds((prev) => [...prev, { id: audio.id, path: audio.originalPath, type: 0 }]);
    } else {
      try {
        const u = cleanUri(audio.uri);
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    setAudios((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const saveFileRecord = async ({ filename, slot, isAudio, mediaData, codTablaReal, elementId, tipiId, defiUUID }) => {
    const { tipo } = getElementoInfo();

    return await saveArchivoLocal({
      ArchInterno: null,
      ArchTipo: isAudio ? 0 : slot,
      ArchTabla: "Deficiencias",
      ArchCodTabla: codTablaReal,
      ArchNombre: filename,

      // ✅ solo fotos tienen coordenadas
      ArchLatitud: isAudio ? null : (mediaData?.latUtm ?? null),
      ArchLongitud: isAudio ? null : (mediaData?.lonUtm ?? null),

      // ✅ LA MISMA FECHA DE CAPTURA
      ArchFecha: mediaData?.fechaISO ?? nowPeruISO(),

      ArchTipoElemento: tipo === "Poste" ? "POST" : "VANO",
      ArchIdElemento: elementId,
      TipiInterno: tipiId,
      ArchActivo: 1,
      EstadoOffLine: 2,
      DefiUUID: defiUUID
    });
  };


  const finalizar = async () => {
    if (!requireEditPermission()) return;
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      setLoading({ active: true, msg: "Guardando..." });

      const deficiencyData = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const codTablaParaGuardar = deficiencyData.DefiServerId ? deficiencyData.DefiServerId : deficiencyData.DefiInterno;
      const defiCodUnico = deficiencyData.DefiCol3;
      const currentTipiInterno = selectedDeficiency.typificationId || 0;
      const currentElementId = selectedDeficiency.elementId || selectedItem.PostInterno || selectedItem.VanoInterno || 0;

      const { tipo, codigo } = getElementoInfo();

      const sAlim = safeSeg(alimEtiquetaLocal, "UNK");

      const sSed = safeSeg(selectedSed?.SedCodigo, "SINSED");
      const sTipo = tipo === "Vano" ? "VANO" : "POSTE";
      const sCod = safeSeg(codigo);
      const tipCode = String(selectedDeficiency?.typificationCode ?? "");
      const is7004 = tipCode === "7004";

      let defFolderSegment = safeSeg(tipCode, "SINDEF");
      let defNameSegment = defFolderSegment;

      const elementBaseRel = `SIGRE.MOVIL/${sAlim}/${sSed}/${sTipo}/${sCod}/`;

      const hasNewPhotos = photos.some((p) => p && !p.id);
      const hasNewAudios = audios.some((a) => a && !a.id);
      const hasDeletedPhotos = deletedIds.some((d) => d.type !== 0);
      const hasDeletedAudios = deletedIds.some((d) => d.type === 0);

      const needPictures = hasNewPhotos || hasDeletedPhotos;
      const needMusic = hasNewAudios || hasDeletedAudios;

      let relativeFolderPath = null;

      if (is7004) {
        const anyPath =
          photos.find((p) => p?.id && p?.originalPath)?.originalPath ||
          deletedIds.find((d) => d?.path)?.path;

        const existingCorr = extract7004IndexFromPath(anyPath);
        const correlativo = existingCorr ?? (await getNext7004Correlativo(elementBaseRel));

        defFolderSegment = `7004/${correlativo}`;
        defNameSegment = `7004_${correlativo}`;
        relativeFolderPath = `${elementBaseRel}${defFolderSegment}/`;
      } else {
        defNameSegment = defFolderSegment;
        relativeFolderPath = `${elementBaseRel}${defFolderSegment}/`;
      }

      const carpetaBase = FileSystem.documentDirectory + relativeFolderPath;

      if (hasNewPhotos || hasNewAudios) {
        await ensureDirExists(carpetaBase);
      }

      let picturesTargetDir = null;
      let musicTargetDir = null;

      const pathSegments = relativeFolderPath.split("/").filter((seg) => seg.length > 0);
      let picturesRoot = null;
      let musicRoot = null;

      try {
        if (Platform.OS === "android") {
          picturesRoot = await getOrRequestPublicDir("Pictures", KEY_PICTURES_DIR);

          if (picturesRoot) {
            picturesTargetDir = await ensureSafPath(picturesRoot, pathSegments);
          }

          if (needMusic) {
            musicRoot = await getOrRequestPublicDir("Music", KEY_MUSIC_DIR);
            if (musicRoot) {
              musicTargetDir = await ensureSafPath(musicRoot, pathSegments);
            }
          }
        }
      } catch (e) {
        console.warn("SAF Error:", e.message);
      }

      if (Platform.OS === "android") {
        if (needPictures && !picturesTargetDir) {
          setLoading({ active: false, msg: "" });
          return Alert.alert(
            "Permiso requerido",
            "Para trabajar solo con carpeta pública, debes seleccionar una carpeta en Pictures (SAF). Acepta el permiso e intenta nuevamente."
          );
        }

        if (needMusic && !musicTargetDir) {
          setLoading({ active: false, msg: "" });
          return Alert.alert(
            "Permiso requerido",
            "Para trabajar solo con carpeta pública, debes seleccionar una carpeta en Music (SAF). Acepta el permiso e intenta nuevamente."
          );
        }
      }

      // 3) ELIMINADOS
      if (deletedIds.length > 0) {
        for (const item of deletedIds) {
          const oldRelativePath = normalizeRelativePath(item.path);
          const fileName = basenameFromAnyPath(oldRelativePath);

          const trashRelativePath = toTrashRelativePath(oldRelativePath);

          const oldUri = FileSystem.documentDirectory + oldRelativePath;
          const trashUri = FileSystem.documentDirectory + trashRelativePath;

          const isPlaceholder = !!item?.isPlaceholder;

          // SAF fotos
          try {
            if (item.type !== 0 && picturesRoot) {
              const srcDir = await safDirForRelativeFile(picturesRoot, oldRelativePath);
              const dstDir = await safTrashDirForRelativeFile(picturesRoot, oldRelativePath);

              const files = await SAF.readDirectoryAsync(srcDir);
              const oldSafFile = files.find((u) => safNameMatches(u, fileName));

              if (oldSafFile) {
                await writeFileIntoSafDir({
                  dirUri: dstDir,
                  fileName,
                  mimeType: "image/jpeg",
                  sourceFileUri: oldSafFile,
                });
                await SAF.deleteAsync(oldSafFile);
              } else if (!isPlaceholder) {
                await writeFileIntoSafDir({
                  dirUri: dstDir,
                  fileName,
                  mimeType: "image/jpeg",
                  sourceFileUri: oldUri,
                });
              }
            }
          } catch (e) {
            console.warn("SAF move-photo-to-trash error:", e.message);
          }

          // SAF audio
          try {
            if (item.type === 0 && musicRoot) {
              const srcDir = await safDirForRelativeFile(musicRoot, oldRelativePath);
              const dstDir = await safTrashDirForRelativeFile(musicRoot, oldRelativePath);

              const files = await SAF.readDirectoryAsync(srcDir);
              const oldSafFile = files.find((u) => safNameMatches(u, fileName));

              if (oldSafFile) {
                await writeFileIntoSafDir({
                  dirUri: dstDir,
                  fileName,
                  mimeType: "audio/mp4",
                  sourceFileUri: oldSafFile,
                });
                await SAF.deleteAsync(oldSafFile);
              } else {
                await writeFileIntoSafDir({
                  dirUri: dstDir,
                  fileName,
                  mimeType: "audio/mp4",
                  sourceFileUri: oldUri,
                });
              }
            }
          } catch (e) {
            console.warn("SAF move-audio-to-trash error:", e.message);
          }

          // Local privado
          try {
            if (isPlaceholder) {
              if (item?.sourceUri) {
                await FileSystem.deleteAsync(cleanUri(item.sourceUri), { idempotent: true });
              }
            } else {
              const info = await FileSystem.getInfoAsync(oldUri);
              if (info.exists) {
                const trashDir = FileSystem.documentDirectory + getDirFromRelative(trashRelativePath);
                await ensureDirExists(trashDir);
                await FileSystem.moveAsync({ from: oldUri, to: trashUri });
              }
            }
          } catch (e) {
            console.warn("Move local to ELIMINADOS error:", e.message);
          }

          await markArchivoAsDeleted(item.id, trashRelativePath);
        }
      }

      // 4) FOTOS NUEVAS
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo || photo.id) continue;
        if (photo?.isPlaceholder) continue;

        const baseName = basenameFromAnyPath(photo.uri);
        if (baseName.startsWith(PLACEHOLDER_PREFIX)) continue;

        const cleanSrcUri = photo.uri.split("?")[0];

        const capturedAtMsRaw = Number(photo?.capturedAtMs) || getUniqueNowMs();
        const capturedAtMs = roundMsForSqlDatetime(capturedAtMsRaw);

        const fechaISO = formatLocalISO(capturedAtMs);
        const { date, time } = getStampPartsFromMs(capturedAtMs);




        const fname = buildMediaName({
          prefix: "FOT",
          sed: selectedSed?.SedCodigo,
          codigo,
          def: defNameSegment,
          suffix: i + 1,
          ext: "jpg",
          date,
          time
        });

        const destUri = carpetaBase + fname;

        await FileSystem.copyAsync({ from: cleanSrcUri, to: destUri });

        await writeFileIntoSafDir({
          dirUri: picturesTargetDir,
          fileName: fname,
          mimeType: "image/jpeg",
          sourceFileUri: destUri
        });

        const pathParaBD = relativeFolderPath + fname;

        await saveFileRecord({
          filename: pathParaBD,
          slot: i + 1,
          isAudio: false,
          mediaData: { ...photo, capturedAtMs, fechaISO },
          codTablaReal: codTablaParaGuardar,
          elementId: currentElementId,
          tipiId: currentTipiInterno,
          defiUUID: defiCodUnico,
        });



        try { await FileSystem.deleteAsync(destUri, { idempotent: true }); } catch { }
        try { await FileSystem.deleteAsync(cleanSrcUri, { idempotent: true }); } catch { }
      }

      // 5) AUDIOS NUEVOS
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (!audio || audio.id) continue;

        const cleanSrcUri = audio.uri.split("?")[0];

        const capturedAtMsRaw = Number(audio?.capturedAtMs) || getUniqueNowMs();
        const capturedAtMs = roundMsForSqlDatetime(capturedAtMsRaw);

        const fechaISO = formatLocalISO(capturedAtMs);
        const { date, time } = getStampPartsFromMs(capturedAtMs);




        const fname = buildMediaName({
          prefix: "AUD",
          sed: selectedSed?.SedCodigo,
          codigo,
          def: defNameSegment,
          suffix: i + 1, // ✅ para que nunca choque si grabas varios
          ext: "m4a",
          date,
          time
        });



        const destUri = carpetaBase + fname;

        await FileSystem.copyAsync({ from: cleanSrcUri, to: destUri });

        await writeFileIntoSafDir({
          dirUri: musicTargetDir,
          fileName: fname,
          mimeType: "audio/mp4",
          sourceFileUri: destUri
        });

        const pathParaBD = relativeFolderPath + fname;

        await saveFileRecord({
          filename: pathParaBD,
          slot: 0,
          isAudio: true,
          mediaData: { ...audio, capturedAtMs, fechaISO },
          codTablaReal: codTablaParaGuardar,
          elementId: currentElementId,
          tipiId: currentTipiInterno,
          defiUUID: defiCodUnico
        });



        try { await FileSystem.deleteAsync(destUri, { idempotent: true }); } catch { }
        try { await FileSystem.deleteAsync(cleanSrcUri, { idempotent: true }); } catch { }
      }

      setLoading({ active: false, msg: "" });

      const validationReport = await runPostSaveValidations({
        canGeneratePlaceholders,
        isElevated,
        selectedDeficiencyId: selectedDeficiency.id,

        fetchMediosByDeficienciaId,
        markArchivoAsInactive,
        setDefiInspeccionadoLocal,
        recalcularPinInspeccionadoParaElemento,

        picturesRoot,
        picturesTargetDir,
        pathSegments,
        deficiencyData,
        photosSnapshot: photos,
      });

      Alert.alert(validationReport.titulo, validationReport.resumen, [
        { text: "OK", onPress: () => router.replace("/inspection") },
      ]);
    } catch (err) {
      setLoading({ active: false, msg: "" });
      Alert.alert("Error", err.message);
    }
  };

  const discardChanges = async () => {
    const tempPhotoUris = photos
      .filter((p) => p && !p.id && p.uri)
      .map((p) => cleanUri(p.uri));

    const tempAudioUris = audios
      .filter((a) => a && !a.id && a.uri)
      .map((a) => cleanUri(a.uri));

    for (const u of [...tempPhotoUris, ...tempAudioUris]) {
      try {
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    setPhotos(originalPhotos);
    setAudios(originalAudios);
    setDeletedIds([]);
    setIsDirty(false);
    setPreviewPhoto(null);
    setPreviewIndex(null);
    setReplaceTarget(null);
    setCameraModal(false);
    setAudioModal(false);
  };

  const onCancel = () => {
    if (!isDirty) return router.replace("/inspection");

    Alert.alert(
      "Descartar cambios",
      "Tienes cambios sin guardar. ¿Deseas descartarlos?",
      [
        { text: "Seguir editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            await discardChanges();
            router.replace("/inspection");
          }
        }
      ]
    );
  };

  const closeCamera = (restorePreview = true) => {
    setCameraModal(false);

    const target = replaceTargetRef.current;

    if (restorePreview && target?.oldPhoto?.uri) {
      setPreviewIndex(target.index ?? null);
      setPreviewPhoto(target.oldPhoto.uri);
    }

    replaceTargetRef.current = null;
    setReplaceTarget(null);
    setPhotoIndex(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (!selectedDeficiency?.id) return;
      if (!dbReady) return;
      if (currentUserId == null) return;

      loadMedios();

      return () => {
        setPhotos(Array(6).fill(null));
        setAudios([]);
        setPreviewPhoto(null);
        setPhotoIndex(null);
        setCameraModal(false);
        setAudioModal(false);
        setDeletedIds([]);
        setPlaceholderQueue([]);
        setPendingOriginalSnapshot(false);
      };
    }, [selectedDeficiency?.id, dbReady, currentUserId, isAdmin, isSupervisor, isInspector])
  );

  const startReplacePhoto = (index) => {
    if (!requireEditPermission()) return;

    const oldPhoto = photos[index];
    if (!oldPhoto) return;

    const target = { index, oldPhoto };
    replaceTargetRef.current = target;
    setReplaceTarget(target);
    setPhotoIndex(index);
    setCameraModal(true);
  };

  const onFinalize = () => {
    if (!canEdit) {
      return Alert.alert("Solo lectura", "No puedes guardar cambios en una deficiencia de otro usuario.");
    }

    if (!requireEditPermission()) return;

    if (!isDirty) {
      return Alert.alert("Sin cambios", "No hay cambios para guardar.");
    }

    const requiredIdx = [0, 1, 2, 3];
    const missing = requiredIdx.filter((i) => !photos[i]);

    if (missing.length > 0) {
      const faltan = missing.map((i) => `• ${PHOTO_SLOTS[i]}`).join("\n");

      return Alert.alert(
        "Fotos obligatorias (recordatorio)",
        `Faltan estas fotos:\n\n${faltan}\n\nPuedes continuar igual.`,
        [{ text: "Aceptar", onPress: () => finalizar() }]
      );
    }

    finalizar();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {!!currentPlaceholderJob && (
        <ViewShot
          ref={placeholderShotRef}
          options={{ format: "jpg", quality: 0.9 }}
          style={{ position: "absolute", left: -10000, top: -10000 }}
        >
          <View style={{ width: 620, height: 450, backgroundColor: "#fff", padding: 18 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
              {PLACEHOLDER_PREFIX} FOTO NO DISPONIBLE EN ESTE DISPOSITIVO
            </Text>

            <Text style={{ fontSize: 14, marginBottom: 10 }}>
              Esta imagen fue generada automáticamente (SISTEMA) para evitar {"\n"}
              validaciones erróneas cuando la BD descargada tiene un registro {"\n"}
              en Archivos pero el archivo físico no está en el equipo.
            </Text>

            <View style={{ flex: 1 }}>
              {buildPlaceholderLines(currentPlaceholderJob.arch).map((line, i) => (
                <Text key={`${currentPlaceholderJob.key}-${i}`} style={{ fontSize: 14 }}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        </ViewShot>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {defOwnerId != null && !canEdit && (
          <View style={{ backgroundColor: "#FEF3C7", padding: 10, borderRadius: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: "700" }}>🔒 Modo solo lectura</Text>
            <Text>
              Esta deficiencia pertenece a otro usuario. Solo el creador o un Administrador/Supervisor puede editar multimedia.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>📸 Registro de Fotos</Text>
          </View>

          <View style={styles.grid}>
            {PHOTO_SLOTS.map((title, index) => (
              <PhotoCard
                key={index}
                title={title}
                uri={photos[index]?.uri}
                onPress={() => {
                  if (photos[index]?.uri) {
                    setPreviewPhoto(photos[index].uri);
                    setPreviewIndex(index);
                  } else {
                    if (!canEdit) {
                      return Alert.alert("Solo lectura", "No puedes agregar fotos en una deficiencia de otro usuario.");
                    }
                    setReplaceTarget(null);
                    setPhotoIndex(index);
                    setCameraModal(true);
                  }
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.audioHeader}>
            <Text style={styles.title}>🎙️ Registro de Audio</Text>
            <TouchableOpacity
              style={[styles.recButton, !canEdit && { opacity: 0.45 }]}
              onPress={() => {
                if (!requireEditPermission()) return;
                setAudioModal(true);
              }}
              disabled={!canEdit}
            >
              <Text style={styles.recText}>● REC</Text>
            </TouchableOpacity>
          </View>

          {audios.map((audio, index) => (
            <View key={index} style={{ marginBottom: 8 }}>
              <AudioCard
                title={audio.title}
                uri={audio.uri}
                onPress={
                  !audio?.uri
                    ? () =>
                      Alert.alert(
                        "Audio no disponible",
                        "La BD tiene el registro, pero el archivo no está en la carpeta pública (Music)."
                      )
                    : undefined
                }
                onDelete={() => handleDeleteAudio(index)}
              />
            </View>
          ))}
          {audios.length === 0 && <Text style={styles.emptyText}>No hay audios grabados</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>CANCELAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishButton, (!isDirty || !canEdit) && styles.finishButtonDisabled]}
            onPress={() => {
              if (!requireEditPermission()) return;
              onFinalize();
            }}
            disabled={!isDirty || !canEdit}
          >
            <Text style={[styles.finishText, !isDirty && styles.finishTextDisabled]}>
              FINALIZAR
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ModalCamera
        visible={cameraModal}
        onClose={() => closeCamera(true)}
        onRequestClose={() => closeCamera(true)}
        onPhoto={async (p) => {
          const target = replaceTargetRef.current;
          if (target?.oldPhoto) {
            const old = target.oldPhoto;

            if (old?.id) {
              setDeletedIds((prev) => [
                ...prev,
                {
                  id: old.id,
                  path: old.originalPath,
                  type: old.type,
                  sourceUri: old?.isPlaceholder ? cleanUri(old.uri) : undefined,
                  isPlaceholder: !!old?.isPlaceholder
                }
              ]);
            } else if (old?.uri) {
              try {
                const u = cleanUri(old.uri);
                const info = await FileSystem.getInfoAsync(u);
                if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
              } catch { }
            }
          }

          setPhotos((prev) => {
            const c = [...prev];
            c[photoIndex] = p;
            return c;
          });

          setIsDirty(true);

          setPreviewPhoto(null);
          setPreviewIndex(null);

          replaceTargetRef.current = null;
          setReplaceTarget(null);
          setPhotoIndex(null);
          setCameraModal(false);
        }}
      />

      <ModalAudio
        visible={audioModal}
        onClose={() => setAudioModal(false)}
        onAudioRecorded={({ uri, capturedAtMs }) => {
          const raw = Number(capturedAtMs) || getUniqueNowMs();
          const ms = roundMsForSqlDatetime(raw);

          setAudios((prev) => [
            ...prev,
            { uri, title: `Nota ${prev.length + 1}`, fechaISO: formatLocalISO(ms), capturedAtMs: ms }
          ]);
          setIsDirty(true);
        }}



      />

      <PhotoModal
        visible={!!previewPhoto}
        uri={previewPhoto}
        title={previewIndex != null ? PHOTO_SLOTS[previewIndex] : "Foto"}
        onClose={() => {
          setPreviewPhoto(null);
          setPreviewIndex(null);
        }}
        onReplace={
          canEdit
            ? () => {
              if (previewIndex == null) return;
              setPreviewPhoto(null);
              startReplacePhoto(previewIndex);
            }
            : undefined
        }
        onDelete={
          canEdit
            ? async () => {
              if (previewIndex == null) return;
              await handleDeletePhoto(previewIndex);
              setPreviewPhoto(null);
              setPreviewIndex(null);
            }
            : undefined
        }
      />

      <Modal visible={loading.active} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>{loading.msg}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
