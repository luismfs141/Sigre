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

import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";


import AudioCard from "../../components/Multimedia/AudioCard";
import PhotoCard from "../../components/Multimedia/PhotoCard";

import ViewShot from "react-native-view-shot";
import PhotoModal from "../../components/Modal/PhotoModal";

import { styles } from "../../styles/MultimediaStyles";





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
  safDirForRelativeFileReadOnly,
  safNameMatches,
  safTrashDirForRelativeFile,
  writeFileIntoSafDir
} from "../../utils/Multimedia/safUtils";


export default function Multimedia() {
  const router = useRouter();

  const replaceTargetRef = useRef(null);
  const initialInspeccionadoRef = useRef({ defId: null, value: null });

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
  const { saveArchivoLocal, fetchMediosByDeficienciaId, markArchivoAsDeleted } = useFiles();


  const { fetchDeficiencyByIdLocal, setDefiInspeccionadoLocal, autoSyncDeficiency } = useDeficiency();



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


  // ==========================
  // DRAFT / STAGING (PRIVADO)
  // ==========================
  const DRAFT_VERSION = 1;

  const getDraftBaseRel = (defId) => `SIGRE.DRAFT/DEF_${defId}/`;
  const getDraftPhotosDir = (defId) =>
    FileSystem.documentDirectory + getDraftBaseRel(defId) + "photos/";
  const getDraftAudiosDir = (defId) =>
    FileSystem.documentDirectory + getDraftBaseRel(defId) + "audios/";
  const getDraftManifestUri = (defId) =>
    FileSystem.documentDirectory + getDraftBaseRel(defId) + "manifest.json";

  const safeJsonParse = (txt) => {
    try {
      return JSON.parse(txt);
    } catch {
      return null;
    }
  };

  const readDraftManifestSafe = async (defId) => {
    if (!defId) return null;
    const uri = getDraftManifestUri(defId);
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return null;

      const raw = await FileSystem.readAsStringAsync(uri);
      const data = safeJsonParse(raw);

      if (!data || data.v !== DRAFT_VERSION) return null;
      if (Number(data.defId) !== Number(defId)) return null;

      return data;
    } catch {
      return null;
    }
  };

  const writeDraftManifestSafe = async (defId, data) => {
    if (!defId) return;
    const baseDir = FileSystem.documentDirectory + getDraftBaseRel(defId);

    try {
      await ensureDirExists(baseDir);
      const uri = getDraftManifestUri(defId);

      const payload = {
        v: DRAFT_VERSION,
        defId: Number(defId),
        updatedAtMs: Date.now(),
        ...data,
      };

      await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload));
    } catch (e) {
      console.warn("⚠️ No se pudo guardar manifest DRAFT:", e?.message ?? e);
    }
  };

  const clearDraftSessionSafe = async (defId) => {
    if (!defId) return;
    try {
      const baseDir = FileSystem.documentDirectory + getDraftBaseRel(defId);
      await FileSystem.deleteAsync(baseDir, { idempotent: true });
    } catch {
      // idempotente
    }
  };

  const buildDraftSnapshot = ({ nextPhotos, nextAudios, nextDeletedIds }) => {
    const draftPhotos = Array(6).fill(null);
    for (let i = 0; i < 6; i++) {
      const p = nextPhotos?.[i];
      if (!p) continue;

      // SOLO DRAFT: no tiene id y no es placeholder
      if (p?.id) continue;
      if (p?.isPlaceholder) continue;

      draftPhotos[i] = {
        uri: cleanUri(p.uri),
        capturedAtMs: Number(p?.capturedAtMs) || null,
        fechaISO: p?.fechaISO ?? null,
      };
    }

    const draftAudios = (nextAudios ?? [])
      .filter((a) => a && !a.id && a.uri)
      .map((a) => ({
        uri: cleanUri(a.uri),
        capturedAtMs: Number(a?.capturedAtMs) || null,
        fechaISO: a?.fechaISO ?? null,
        title: a?.title ?? "Audio",
      }));

    return {
      draftPhotos,
      draftAudios,
      deletedIds: nextDeletedIds ?? [],
    };
  };

  const persistDraftSnapshotSafe = async ({ nextPhotos, nextAudios, nextDeletedIds }) => {
    const defId = selectedDeficiency?.id;
    if (!defId) return;

    const snap = buildDraftSnapshot({ nextPhotos, nextAudios, nextDeletedIds });

    const hasDraftPhotos = snap.draftPhotos.some(Boolean);
    const hasDraftAudios = (snap.draftAudios?.length ?? 0) > 0;
    const hasDeletes = (snap.deletedIds?.length ?? 0) > 0;

    if (!hasDraftPhotos && !hasDraftAudios && !hasDeletes) {
      await clearDraftSessionSafe(defId);
      return;
    }

    await writeDraftManifestSafe(defId, snap);
  };

  const stagePhotoToDraft = async ({ defId, slotIndex, photo }) => {
    const raw = Number(photo?.capturedAtMs) || getUniqueNowMs();
    const ms = roundMsForSqlDatetime(raw);
    const fechaISO = formatLocalISO(ms);

    const { date, time } = getStampPartsFromMs(ms);
    const fileName = `DRAFT_FOT_${slotIndex + 1}_${date}_${time}.jpg`;

    const dir = getDraftPhotosDir(defId);
    await ensureDirExists(dir);

    const fromUri = cleanUri(photo.uri);
    const toUri = dir + fileName;

    await FileSystem.copyAsync({ from: fromUri, to: toUri });

    // limpiamos el temporal
    try { await FileSystem.deleteAsync(fromUri, { idempotent: true }); } catch { }

    return {
      ...photo,
      uri: toUri,
      capturedAtMs: ms,
      fechaISO,
      isDraft: true,
    };
  };

  const stageAudioToDraft = async ({ defId, audio }) => {
    const raw = Number(audio?.capturedAtMs) || getUniqueNowMs();
    const ms = roundMsForSqlDatetime(raw);
    const fechaISO = formatLocalISO(ms);

    const { date, time } = getStampPartsFromMs(ms);
    const fileName = `DRAFT_AUD_${date}_${time}.m4a`;

    const dir = getDraftAudiosDir(defId);
    await ensureDirExists(dir);

    const fromUri = cleanUri(audio.uri);
    const toUri = dir + fileName;

    await FileSystem.copyAsync({ from: fromUri, to: toUri });

    // limpiamos el temporal
    try { await FileSystem.deleteAsync(fromUri, { idempotent: true }); } catch { }

    return {
      ...audio,
      uri: toUri,
      capturedAtMs: ms,
      fechaISO,
      isDraft: true,
    };
  };



  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;

    setLoading({ active: true, msg: "Cargando..." });
    setDeletedIds([]);

    try {
      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);

      // ✅ snapshot inicial SOLO al entrar (o si cambió de deficiencia)
      if (initialInspeccionadoRef.current.defId !== selectedDeficiency.id) {
        initialInspeccionadoRef.current = {
          defId: selectedDeficiency.id,
          value: Number(deficiencia?.DefiInspeccionado) ? 1 : 0,
        };
      }


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

      // ==========================
      // APLICAR DRAFT SI EXISTE
      // ==========================
      let mergedPhotos = photosTmp;
      let mergedAudios = audiosTmp;
      let mergedDeleted = [];
      let appliedDraft = false;

      if (_canEdit && selectedDeficiency?.id) {
        const draft = await readDraftManifestSafe(selectedDeficiency.id);

        if (draft) {
          const dPhotos = Array.isArray(draft.draftPhotos) ? draft.draftPhotos : [];
          const dAudios = Array.isArray(draft.draftAudios) ? draft.draftAudios : [];
          const dDeletes = Array.isArray(draft.deletedIds) ? draft.deletedIds : [];

          // merge fotos
          const tmp = [...mergedPhotos];
          for (let i = 0; i < 6; i++) {
            const dp = dPhotos[i];
            if (!dp?.uri) continue;

            try {
              const info = await FileSystem.getInfoAsync(dp.uri);
              if (!info.exists) continue;

              tmp[i] = {
                ...(tmp[i] || {}),
                uri: dp.uri,
                capturedAtMs: Number(dp?.capturedAtMs) || null,
                fechaISO: dp?.fechaISO ?? null,
                isDraft: true,
              };
              appliedDraft = true;
            } catch { }
          }
          mergedPhotos = tmp;

          // merge audios
          const aud = [...mergedAudios];
          for (const da of dAudios) {
            if (!da?.uri) continue;

            try {
              const info = await FileSystem.getInfoAsync(da.uri);
              if (!info.exists) continue;

              aud.push({
                uri: da.uri,
                title: da?.title ?? "Audio",
                id: null,
                type: 0,
                fechaISO: da?.fechaISO ?? null,
                capturedAtMs: Number(da?.capturedAtMs) || null,
                isDraft: true,
              });
              appliedDraft = true;
            } catch { }
          }
          mergedAudios = aud;

          // deletes
          mergedDeleted = dDeletes;
          if (dDeletes.length > 0) appliedDraft = true;
        }
      } else {
        // si no puede editar, limpiamos cualquier draft viejo de esa deficiencia
        if (selectedDeficiency?.id) await clearDraftSessionSafe(selectedDeficiency.id);
      }

      setPhotos(mergedPhotos);
      setAudios(mergedAudios);

      // "original" es el baseline de BD (sin draft)
      setOriginalPhotos(photosTmp);
      setOriginalAudios(audiosTmp);

      setDeletedIds(mergedDeleted);
      setIsDirty(appliedDraft);

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

    let nextDeleted = [...deletedIds];

    if (photo?.id) {
      nextDeleted = [
        ...nextDeleted,
        {
          id: photo.id,
          path: photo.originalPath,
          type: photo.type,
          sourceUri: photo?.isPlaceholder ? cleanUri(photo.uri) : undefined,
          isPlaceholder: !!photo?.isPlaceholder,
        },
      ];
    } else {
      // DRAFT: borrar físico inmediato
      try {
        const u = cleanUri(photo.uri);
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    const nextPhotos = [...photos];
    nextPhotos[index] = null;

    setDeletedIds(nextDeleted);
    setPhotos(nextPhotos);
    setIsDirty(true);

    await persistDraftSnapshotSafe({
      nextPhotos,
      nextAudios: audios,
      nextDeletedIds: nextDeleted,
    });
  };


  const handleDeleteAudio = async (index) => {
    const audio = audios[index];
    if (!audio) return;
    if (!requireEditPermission()) return;

    let nextDeleted = [...deletedIds];

    if (audio?.id) {
      nextDeleted = [...nextDeleted, { id: audio.id, path: audio.originalPath, type: 0 }];
    } else {
      // DRAFT: borrar físico inmediato
      try {
        const u = cleanUri(audio.uri);
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    const nextAudios = audios.filter((_, i) => i !== index);

    setDeletedIds(nextDeleted);
    setAudios(nextAudios);
    setIsDirty(true);

    await persistDraftSnapshotSafe({
      nextPhotos: photos,
      nextAudios,
      nextDeletedIds: nextDeleted,
    });
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

  // ==========================
  // 🧹 CLEANUP: SAF empty folders (Android)
  // ==========================
  const cleanupEmptyAncestorsSaf = async (rootUri, relativeFilePath) => {
    try {
      if (Platform.OS !== "android") return;
      if (!rootUri || !relativeFilePath) return;

      const rel = normalizeRelativePath(relativeFilePath);
      const dirRel = getDirFromRelative(rel); // ejemplo: SIGRE.MOVIL/.../7004/3/
      if (!dirRel) return;

      const segs = dirRel.split("/").filter(Boolean);
      // Evitar borrar por encima de SIGRE.MOVIL (lo dejamos como “base”)
      if (segs.length <= 1) return;

      // Desde la carpeta más profunda hacia arriba
      for (let i = segs.length; i > 1; i--) {
        const currentDirRel = segs.slice(0, i).join("/") + "/";

        // Truco: resolver el URI del directorio usando el resolver de “file”
        const dirUri = await safDirForRelativeFileReadOnly(rootUri, currentDirRel + "__dir__");
        if (!dirUri) break;

        const children = (await SAF.readDirectoryAsync(dirUri)) ?? [];
        if (children.length > 0) break; // ya tiene algo, paramos

        // Está vacío -> borrar carpeta
        await SAF.deleteAsync(dirUri);
      }
    } catch {
      // si falla, no rompe el flujo
    }
  };

  // ==========================
  // 🧹 CLEANUP: Private cache (Android)
  // ==========================
  const cleanupPrivateMultimediaAndroidSafe = async () => {
    try {
      if (Platform.OS !== "android") return;

      // 1) borrar placeholders (se regeneran si hace falta)
      try {
        await FileSystem.deleteAsync(PLACEHOLDER_DIR, { idempotent: true });
      } catch { }

      // 2) borrar cualquier multimedia privada vieja (de versiones anteriores)
      //    OJO: NO borres documentDirectory completo, solo esta carpeta.
      try {
        await FileSystem.deleteAsync(FileSystem.documentDirectory + "SIGRE.MOVIL/", {
          idempotent: true,
        });
      } catch { }
    } catch {
      // silencioso
    }
  };

  const get7004CorrelativoFromDbSafe = async (defData) => {
    try {
      const ids = [];
      const sid = Number(defData?.DefiServerId);
      const lid = Number(defData?.DefiInterno);

      if (Number.isFinite(sid) && sid > 0) ids.push(sid);
      if (Number.isFinite(lid) && lid > 0 && lid !== sid) ids.push(lid);

      let best = null;

      for (const id of ids) {
        const rows = await fetchMediosByDeficienciaId(id); // puede traer activos e inactivos
        const corrs = (rows ?? [])
          .map((r) => extract7004IndexFromPath(r?.ArchNombre))
          .filter((n) => Number.isFinite(n));

        if (corrs.length) {
          const min = Math.min(...corrs);
          best = best == null ? min : Math.min(best, min);
        }
      }

      return best; // null si no encuentra
    } catch {
      return null;
    }
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

        let correlativo = extract7004IndexFromPath(anyPath);

        // ✅ si ya existió antes (aunque hoy no tenga fotos), lo sacamos de BD
        if (correlativo == null) {
          correlativo = await get7004CorrelativoFromDbSafe(deficiencyData);
        }

        // ✅ si nunca existió, recién asignamos uno nuevo
        if (correlativo == null) {
          correlativo = await getNext7004Correlativo(elementBaseRel);
        }

        defFolderSegment = `7004/${correlativo}`;
        defNameSegment = `7004_${correlativo}`;
        relativeFolderPath = `${elementBaseRel}${defFolderSegment}/`;
      } else {
        defNameSegment = defFolderSegment;
        relativeFolderPath = `${elementBaseRel}${defFolderSegment}/`;
      }

      const carpetaBase = FileSystem.documentDirectory + relativeFolderPath;

      // iOS NO tiene SAF público: guardamos final en privado
      if (Platform.OS !== "android" && (hasNewPhotos || hasNewAudios)) {
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
          const isPlaceholder = !!item?.isPlaceholder;

          // ✅ Android: borrar cache privado (NO mover a trash privado)
          if (Platform.OS === "android") {
            // placeholder cache
            if (isPlaceholder && item?.sourceUri) {
              try { await FileSystem.deleteAsync(cleanUri(item.sourceUri), { idempotent: true }); } catch { }
            }

            // restos de versiones antiguas (si existiera el archivo privado)
            try {
              const info = await FileSystem.getInfoAsync(oldUri);
              if (info.exists) await FileSystem.deleteAsync(oldUri, { idempotent: true });
            } catch { }
          }

          // ==========================
          // SAF FOTOS (Pictures)
          // ==========================
          if (item.type !== 0 && picturesRoot) {
            try {
              const srcDir = await safDirForRelativeFileReadOnly(picturesRoot, oldRelativePath);
              const dstDir = await safTrashDirForRelativeFile(picturesRoot, oldRelativePath);

              if (srcDir) {
                const files = (await SAF.readDirectoryAsync(srcDir)) ?? [];
                const oldSafFile = files.find((u) => safNameMatches(u, fileName));

                if (oldSafFile) {
                  await writeFileIntoSafDir({
                    dirUri: dstDir,
                    fileName,
                    mimeType: "image/jpeg",
                    sourceFileUri: oldSafFile,
                  });
                  await SAF.deleteAsync(oldSafFile);
                }
              }

              // ✅ borrar carpetas vacías hacia arriba (solo Pictures)
              await cleanupEmptyAncestorsSaf(picturesRoot, oldRelativePath);
            } catch (e) {
              console.warn("SAF move-photo-to-trash error:", e?.message ?? e);
            }
          }

          // ==========================
          // SAF AUDIOS (Music)
          // ==========================
          if (item.type === 0 && musicRoot) {
            try {
              const srcDir = await safDirForRelativeFileReadOnly(musicRoot, oldRelativePath);
              const dstDir = await safTrashDirForRelativeFile(musicRoot, oldRelativePath);

              if (srcDir) {
                const files = (await SAF.readDirectoryAsync(srcDir)) ?? [];
                const oldSafFile = files.find((u) => safNameMatches(u, fileName));

                if (oldSafFile) {
                  await writeFileIntoSafDir({
                    dirUri: dstDir,
                    fileName,
                    mimeType: "audio/mp4",
                    sourceFileUri: oldSafFile,
                  });
                  await SAF.deleteAsync(oldSafFile);
                }
              }

              // ✅ borrar carpetas vacías hacia arriba (solo Music)
              await cleanupEmptyAncestorsSaf(musicRoot, oldRelativePath);
            } catch (e) {
              console.warn("SAF move-audio-to-trash error:", e?.message ?? e);
            }
          }

          // ✅ BD: marcar como eliminado (ruta ahora apunta a trash)
          await markArchivoAsDeleted(item.id, trashRelativePath);
        }
      }

      // 4) FOTOS NUEVAS (DRAFT -> COMMIT)
      let existingPublicPics = [];
      if (Platform.OS === "android" && picturesTargetDir) {
        try {
          existingPublicPics = (await SAF.readDirectoryAsync(picturesTargetDir)) ?? [];
        } catch { }
      }

      const publicHasPic = (fileName) =>
        (existingPublicPics ?? []).some((u) => safNameMatches(u, fileName));

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo || photo.id) continue;
        if (photo?.isPlaceholder) continue;

        const srcUri = cleanUri(photo.uri);

        // timestamp estable (para que si se reintenta no cambie el nombre)
        const capturedAtMsRaw = Number(photo?.capturedAtMs) || getUniqueNowMs();
        const capturedAtMs = roundMsForSqlDatetime(capturedAtMsRaw);

        const fechaISO = photo?.fechaISO ?? formatLocalISO(capturedAtMs);
        const { date, time } = getStampPartsFromMs(capturedAtMs);

        const fname = buildMediaName({
          prefix: "FOT",
          sed: selectedSed?.SedCodigo,
          codigo,
          def: defNameSegment,
          suffix: i + 1,
          ext: "jpg",
          date,
          time,
        });

        const pathParaBD = relativeFolderPath + fname;

        // ANDROID: escribir a pública (SAF) directo desde DRAFT
        if (Platform.OS === "android") {
          if (!picturesTargetDir) {
            throw new Error("No hay carpeta pública (Pictures) seleccionada.");
          }

          if (!publicHasPic(fname)) {
            await writeFileIntoSafDir({
              dirUri: picturesTargetDir,
              fileName: fname,
              mimeType: "image/jpeg",
              sourceFileUri: srcUri,
            });

            // refrescar lista local (evita duplicados si el loop repite)
            try {
              existingPublicPics.push(`${fname}`); // no importa el formato exacto, publicHasPic usa safNameMatches con uris reales,
              // pero igual dejamos el control principal con readDirectoryAsync inicial.
            } catch { }
          }
        } else {
          // iOS: mover a privado final
          const destUri = carpetaBase + fname;
          const info = await FileSystem.getInfoAsync(destUri);
          if (!info.exists) {
            await FileSystem.moveAsync({ from: srcUri, to: destUri });
          }
        }

        // guardar registro BD
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

        // limpiar DRAFT en Android (en iOS ya se movió)
        if (Platform.OS === "android") {
          try { await FileSystem.deleteAsync(srcUri, { idempotent: true }); } catch { }
        }
      }


      // 5) AUDIOS NUEVOS (DRAFT -> COMMIT)
      let existingPublicAud = [];
      if (Platform.OS === "android" && musicTargetDir) {
        try {
          existingPublicAud = (await SAF.readDirectoryAsync(musicTargetDir)) ?? [];
        } catch { }
      }

      const publicHasAud = (fileName) =>
        (existingPublicAud ?? []).some((u) => safNameMatches(u, fileName));

      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (!audio || audio.id) continue;

        const srcUri = cleanUri(audio.uri);

        const capturedAtMsRaw = Number(audio?.capturedAtMs) || getUniqueNowMs();
        const capturedAtMs = roundMsForSqlDatetime(capturedAtMsRaw);

        const fechaISO = audio?.fechaISO ?? formatLocalISO(capturedAtMs);
        const { date, time } = getStampPartsFromMs(capturedAtMs);

        const fname = buildMediaName({
          prefix: "AUD",
          sed: selectedSed?.SedCodigo,
          codigo,
          def: defNameSegment,
          suffix: i + 1,
          ext: "m4a",
          date,
          time,
        });

        const pathParaBD = relativeFolderPath + fname;

        if (Platform.OS === "android") {
          if (!musicTargetDir) {
            throw new Error("No hay carpeta pública (Music) seleccionada.");
          }

          if (!publicHasAud(fname)) {
            await writeFileIntoSafDir({
              dirUri: musicTargetDir,
              fileName: fname,
              mimeType: "audio/mp4",
              sourceFileUri: srcUri,
            });
          }
        } else {
          const destUri = carpetaBase + fname;
          const info = await FileSystem.getInfoAsync(destUri);
          if (!info.exists) {
            await FileSystem.moveAsync({ from: srcUri, to: destUri });
          }
        }

        await saveFileRecord({
          filename: pathParaBD,
          slot: 0,
          isAudio: true,
          mediaData: { ...audio, capturedAtMs, fechaISO },
          codTablaReal: codTablaParaGuardar,
          elementId: currentElementId,
          tipiId: currentTipiInterno,
          defiUUID: defiCodUnico,
        });

        if (Platform.OS === "android") {
          try { await FileSystem.deleteAsync(srcUri, { idempotent: true }); } catch { }
        }
      }





      // ✅ limpiar staging
      await clearDraftSessionSafe(selectedDeficiency?.id);

      // ✅ Android: dejar 0 multimedia privada (solo SAF público)
      await cleanupPrivateMultimediaAndroidSafe();

      // =========================
      // POST-FINALIZAR: resumen de cambios
      // =========================
      const prevDefiIns = Number(deficiencyData?.DefiInspeccionado) ? 1 : 0;

      // Reglas: fotos obligatorias 1..4 (índices 0..3) — NO cuentan placeholders
      const requiredIdx = [0, 1, 2, 3];

      // Slot cuenta si:
      // - ya existe en BD (tiene id), aunque sea placeholder
      // - o es nueva foto real (sin id y no placeholder)
      const slotOk = (p) => !!p && (p?.id || !p?.isPlaceholder);

      const newDefiIns = requiredIdx.every((i) => slotOk(photos[i])) ? 1 : 0;

      const initialIns =
        initialInspeccionadoRef.current?.defId === selectedDeficiency.id
          ? (Number(initialInspeccionadoRef.current.value) ? 1 : 0)
          : prevDefiIns;

      // ✅ 1) Actualiza SQLITE solo si cambió vs lo que estaba en la BD local en ese momento
      if (newDefiIns !== prevDefiIns) {
        await setDefiInspeccionadoLocal(selectedDeficiency.id, newDefiIns);
      }

      // ✅ 2) Sincroniza SOLO si cambió vs snapshot al entrar a Multimedia
      if (newDefiIns !== initialIns) {
        await autoSyncDeficiency(selectedDeficiency.id);

        // (opcional) actualizar snapshot para evitar re-sync si el usuario no sale y vuelve a finalizar
        initialInspeccionadoRef.current = { defId: selectedDeficiency.id, value: newDefiIns };
      }


      // Conteos
      const countNewPhotos = photos.filter((p) => p && !p.id && !p.isPlaceholder).length;
      const countNewAudios = audios.filter((a) => a && !a.id).length;
      const countDelPhotos = deletedIds.filter((d) => Number(d?.type) !== 0).length;
      const countDelAudios = deletedIds.filter((d) => Number(d?.type) === 0).length;

      // Mensaje final
      const lines = [];
      lines.push("Cambios aplicados a la deficiencia:");
      lines.push(`• Fotos: +${countNewPhotos} nuevas, -${countDelPhotos} eliminadas`);
      lines.push(`• Audios: +${countNewAudios} nuevos, -${countDelAudios} eliminados`);
      const estadoTexto = (v) => (v === 1 ? "Finalizado" : "Pendiente");

      if (newDefiIns === prevDefiIns) {
        lines.push(
          `• Estado de deficiencia: Permanece como ${estadoTexto(newDefiIns)}`
        );
      } else {
        lines.push(
          `• Estado de deficiencia: Cambio a ${estadoTexto(newDefiIns)}`
        );
      }

      setLoading({ active: false, msg: "" });

      const tituloEstado = newDefiIns === 1
        ? "✅ Finalizado"
        : "⏳ Pendiente";

      Alert.alert(tituloEstado, lines.join("\n"), [
        { text: "OK", onPress: () => router.replace("/inspection") },
      ]);



    } catch (err) {
      setLoading({ active: false, msg: "" });
      Alert.alert("Error", err.message);
    }
  };

  const discardChanges = async () => {
    const defId = selectedDeficiency?.id;

    // borrar físicamente TODO lo que sea draft (fotos/audios sin id)
    const tempPhotoUris = photos
      .filter((p) => p && !p.id && p.uri && !p.isPlaceholder)
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

    // borrar manifest + carpeta draft completa (por si quedó algo)
    if (defId) {
      await clearDraftSessionSafe(defId);
    }

    // volver al baseline original (BD)
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

        initialInspeccionadoRef.current = { defId: null, value: null };
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

          {audios.map((audio, index) => {
            const k = audio?.id
              ? `aud-${audio.id}`
              : audio?.uri
                ? `aud-${String(audio.uri)}`
                : `aud-${index}`;

            return (
              <View key={k} style={{ marginBottom: 8 }}>
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
            );
          })}

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
          const defId = selectedDeficiency?.id;
          if (!defId) {
            Alert.alert("Error", "No hay deficiencia seleccionada.");
            return;
          }
          if (photoIndex == null) {
            Alert.alert("Error", "No hay slot de foto seleccionado.");
            return;
          }

          const target = replaceTargetRef.current;

          // 1) construir nextDeleted si estamos reemplazando
          let nextDeleted = [...deletedIds];

          if (target?.oldPhoto) {
            const old = target.oldPhoto;

            if (old?.id) {
              nextDeleted = [
                ...nextDeleted,
                {
                  id: old.id,
                  path: old.originalPath,
                  type: old.type,
                  sourceUri: old?.isPlaceholder ? cleanUri(old.uri) : undefined,
                  isPlaceholder: !!old?.isPlaceholder,
                },
              ];
            } else if (old?.uri) {
              try {
                const u = cleanUri(old.uri);
                const info = await FileSystem.getInfoAsync(u);
                if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
              } catch { }
            }
          }

          // 2) mover/copiado a DRAFT privado (staging)
          let staged = null;
          try {
            staged = await stagePhotoToDraft({
              defId,
              slotIndex: photoIndex,
              photo: p,
            });
          } catch (e) {
            console.error("❌ Error stagePhotoToDraft:", e);
            Alert.alert("Error", "No se pudo guardar la foto en staging.");
            return;
          }

          // 3) aplicar en state
          const nextPhotos = [...photos];
          nextPhotos[photoIndex] = staged;

          setDeletedIds(nextDeleted);
          setPhotos(nextPhotos);
          setIsDirty(true);

          await persistDraftSnapshotSafe({
            nextPhotos,
            nextAudios: audios,
            nextDeletedIds: nextDeleted,
          });

          // UI reset
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
        onAudioRecorded={async ({ uri, capturedAtMs }) => {
          const defId = selectedDeficiency?.id;
          if (!defId) {
            Alert.alert("Error", "No hay deficiencia seleccionada.");
            return;
          }

          try {
            const staged = await stageAudioToDraft({
              defId,
              audio: { uri, capturedAtMs, title: `Nota ${audios.length + 1}` },
            });

            const nextAudios = [
              ...audios,
              {
                uri: staged.uri,
                title: staged.title ?? `Nota ${audios.length + 1}`,
                fechaISO: staged.fechaISO,
                capturedAtMs: staged.capturedAtMs,
                isDraft: true,
              },
            ];

            setAudios(nextAudios);
            setIsDirty(true);

            await persistDraftSnapshotSafe({
              nextPhotos: photos,
              nextAudios,
              nextDeletedIds: deletedIds,
            });

            setAudioModal(false);
          } catch (e) {
            console.error("❌ Error stageAudioToDraft:", e);
            Alert.alert("Error", "No se pudo guardar el audio en staging.");
          }
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
