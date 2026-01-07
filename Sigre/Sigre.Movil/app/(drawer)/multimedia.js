import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";
import { useFeeder } from "../../hooks/useFeeder";
import { useFiles } from "../../hooks/useFiles";

import AudioCard from "../../components/Multimedia/AudioCard";
import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";
import PhotoCard from "../../components/Multimedia/PhotoCard";

/* ======================
   CONSTANTES
====================== */
const PHOTO_SLOTS = [
  "Panorámica",
  "Frontal",
  "Izquierda",
  "Derecha",
  "Def1",
  "Def2",
];

export default function Multimedia() {
  const { selectedItem, selectedSed, selectedDeficiency } = useDatos();
  const { user } = useContext(AuthContext);
  const { findFeederById } = useFeeder();
  const { saveArchivoLocal, fetchMediosByDeficienciaId } = useFiles();
  const { fetchDeficiencyByIdLocal } = useDeficiency();

  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);

  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [audios, setAudios] = useState([]);

  const [photoIndex, setPhotoIndex] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const router = useRouter();

  /* ======================
     CLEANUP
  ====================== */
  const limpiarMultimedia = () => {
    setPhotos(Array(6).fill(null));
    setAudios([]);
    setPreviewPhoto(null);
    setPhotoIndex(null);
    setCameraModal(false);
    setAudioModal(false);
  };

const getAssetUriByRealPath = async (relativePath, filename, mediaType) => {
  let after = null;

  do {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType,
      first: 100,
      after,
      sortBy: MediaLibrary.SortBy.creationTime,
    });

    // Buscar por NOMBRE + RUTA en el URI real
    const asset = page.assets.find(a =>
      a.filename === filename &&
      a.uri.includes(relativePath)
    );

    if (asset) return asset.uri;

    after = page.endCursor;
  } while (after);

  console.warn("❌ Archivo no encontrado:", relativePath, filename);
  return null;
};


  const getAssetUriByPath = async (relativePath, filename, mediaType) => {
    // 1️⃣ Obtener el álbum por nombre (ruta)
    const album = await MediaLibrary.getAlbumAsync(relativePath);
    if (!album) {
      console.warn("❌ Álbum no encontrado:", relativePath);
      return null;
    }

    let after = null;

    // 2️⃣ Buscar solo dentro del álbum
    do {
      const page = await MediaLibrary.getAssetsAsync({
        album,
        mediaType,
        first: 100,
        after,
      });

      const asset = page.assets.find(a => a.filename === filename);
      if (asset) return asset.uri;

      after = page.endCursor;
    } while (after);

    console.warn("❌ Archivo no encontrado en álbum:", relativePath, filename);
    return null;
  };


  /* ======================
     LOAD MEDIOS (FIXED)
  ====================== */
  // const loadMedios = async () => {
  //   // ⛔ VALIDAR ANTES DE PRENDER LOADING
  //   if (!selectedDeficiency?.id) {
  //     limpiarMultimedia();
  //     return;
  //   }

  //   setLoading(true);
  //   setLoadingMessage("Cargando multimedia...");

  //   try {
  //     setLoadingMessage("Obteniendo deficiencia...");
  //     const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);

  //     const deficienciaId =
  //       deficiencia.DefiServerId ?? deficiencia.DefiInterno;

  //     setLoadingMessage("Buscando archivos guardados...");
  //     const medios = await fetchMediosByDeficienciaId(deficienciaId);

  //     const activos = medios.filter(m => Number(m.ArchActivo) === 1);

  //     const photosTmp = Array(6).fill(null);
  //     const audiosTmp = [];

  //     if (activos.length > 0) {
  //       setLoadingMessage("Procesando fotos y audios...");

  //       for (const m of activos) {
  //         const filename = m.ArchNombre.split("/").pop();

  //         if (Number(m.ArchTipo) === 0) {
  //           const uri = await getAssetUriByFilename(
  //             filename,
  //             MediaLibrary.MediaType.audio
  //           );
  //           if (uri) audiosTmp.push({ uri, title: "Audio" });
  //         }

  //         if (Number(m.ArchTipo) > 0 && Number(m.ArchTipo) <= 6) {
  //           const uri = await getAssetUriByFilename(
  //             filename,
  //             MediaLibrary.MediaType.photo
  //           );
  //           if (uri) {
  //             photosTmp[Number(m.ArchTipo) - 1] = {
  //               uri,
  //               latUtm: m.ArchLatitud,
  //               lonUtm: m.ArchLongitud,
  //               fechaISO: m.ArchFecha,
  //             };
  //           }
  //         }
  //       }
  //     }

  //     setPhotos(photosTmp);
  //     setAudios(audiosTmp);
  //   } catch (err) {
  //     console.error("❌ Error cargando medios:", err);
  //   } finally {
  //     setLoading(false);
  //     setLoadingMessage("");
  //   }
  // };

const loadMedios = async () => {
  if (!selectedDeficiency?.id) {
    limpiarMultimedia();
    return;
  }

  setLoading(true);
  setLoadingMessage("Cargando multimedia...");

  try {
    setLoadingMessage("Obteniendo deficiencia...");
    const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);

    const deficienciaId =
      deficiencia.DefiServerId ?? deficiencia.DefiInterno;

    setLoadingMessage("Buscando archivos guardados...");
    const medios = await fetchMediosByDeficienciaId(deficienciaId);

    const activos = medios.filter(m => Number(m.ArchActivo) === 1);

    const photosTmp = Array(6).fill(null);
    const audiosTmp = [];

    if (activos.length > 0) {
      setLoadingMessage("Procesando fotos y audios...");

      for (const m of activos) {
        const fullPath = m.ArchNombre; 
        // SigreMovil/AMAUTA/1465/Vano/VBT000192983/7004/1.jpg

        const filename = fullPath.split("/").pop();
        const relativePath = fullPath.substring(
          0,
          fullPath.lastIndexOf("/")
        );

        // 🎵 AUDIO → Music
        if (Number(m.ArchTipo) === 0) {
          const uri = await getAssetUriByRealPath(
            relativePath,
            filename,
            MediaLibrary.MediaType.audio
          );

          if (uri) {
            audiosTmp.push({
              uri,
              title: "Audio",
            });
          }
        }

        // 📸 FOTO → Pictures
        if (Number(m.ArchTipo) > 0 && Number(m.ArchTipo) <= 6) {
          const uri = await getAssetUriByRealPath(
            relativePath,
            filename,
            MediaLibrary.MediaType.photo
          );

          if (uri) {
            photosTmp[Number(m.ArchTipo) - 1] = {
              uri,
              latUtm: m.ArchLatitud,
              lonUtm: m.ArchLongitud,
              fechaISO: m.ArchFecha,
            };
          }
        }
      }
    }

    setPhotos(photosTmp);
    setAudios(audiosTmp);
  } catch (err) {
    console.error("❌ Error cargando medios:", err);
  } finally {
    setLoading(false);
    setLoadingMessage("");
  }
};


  /* ======================
     FOCUS EFFECT
  ====================== */
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const cargar = async () => {
        if (activo) await loadMedios();
      };

      cargar();

      return () => {
        activo = false;
        limpiarMultimedia();
      };
    }, [selectedDeficiency?.id])
  );

  /* ======================
     BACK HANDLER
  ====================== */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/(drawer)/inspection");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [])
  );

  /* ======================
     HELPERS
  ====================== */
  const getElementoInfo = () => {
    if (selectedItem?.PostInterno)
      return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    if (selectedItem?.VanoInterno)
      return { tipo: "Vano", codigo: selectedItem.VanoCodigo };
    throw new Error("Elemento no soportado");
  };

  const getFilenameFromUri = (uri) => uri?.split("/").pop() ?? null;

  const getAssetUriByFilename = async (filename, mediaType) => {
    let after = null;
    do {
      const page = await MediaLibrary.getAssetsAsync({
        mediaType,
        first: 100,
        after,
      });
      const asset = page.assets.find(a => a.filename === filename);
      if (asset) return asset.uri;
      after = page.endCursor;
    } while (after);
    return null;
  };

  const moveToAlbum = async (uri, albumName, filename) => {
    // 🚫 YA NO pedir permiso aquí

    const tempDir = FileSystem.cacheDirectory + "SigreMovil/";
    const folderInfo = await FileSystem.getInfoAsync(tempDir);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    }

    const localUri = `${tempDir}${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: localUri,
    });

    const asset = await MediaLibrary.createAssetAsync(localUri);

    let album = await MediaLibrary.getAlbumAsync(albumName);
    if (!album) {
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    console.log("Foto guardada en álbum:", filename);
  };


  const moveAudio = async (uri, albumName) => {

    const asset = await MediaLibrary.createAssetAsync(uri);

    try {
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (albumError) {
      console.warn("⚠️ No se pudo crear álbum para audio, continuando...");
    }
  };


  /* ======================
     FINALIZAR (FIXED)
  ====================== */
  const finalizar = async () => {
    if (!selectedItem)
      return Alert.alert("Error", "No hay elemento seleccionado");

    const hasPermission = await ensureMediaPermission();
    if (!hasPermission) return;

    try {
      setLoading(true);
      setLoadingMessage("Preparando guardado...");

      const feeder = await findFeederById(selectedSed.AlimInterno);
      const { tipo, codigo } = getElementoInfo();

      const folderBase = `SigreMovil/${feeder.alimEtiqueta}/${selectedSed.SedCodigo}/${tipo}/${codigo}/${selectedDeficiency.typificationCode}`;

      const folderFinal = selectedDeficiency.numSuministro
        ? `${folderBase}/${selectedDeficiency.numSuministro}`
        : folderBase;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri) {
          setLoadingMessage(`Guardando foto ${i + 1}...`);
          const filename = `${i + 1}.jpg`;
          await moveToAlbum(photo.uri, folderFinal, filename);
          await saveFileRecord({
            filename,
            relativePath: folderFinal,
            slot: i + 1,
            isAudio: false,
            photoData: photo,
          });
        }
      }

      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (audio?.uri) {
          setLoadingMessage(`Guardando audio ${i + 1}...`);
          const filename = getFilenameFromUri(audio.uri);
          await moveAudio(audio.uri, folderFinal);
          await saveFileRecord({
            filename,
            relativePath: folderFinal,
            slot: 0,
            isAudio: true,
          });
        }
      }

      limpiarMultimedia();
      setLoading(false);

      Alert.alert("Éxito", "Multimedia guardada correctamente", [
        { text: "OK", onPress: () => router.replace("/inspection") },
      ]);
    } catch (err) {
      setLoading(false);
      console.error(err);
      Alert.alert("Error", "No se pudo guardar la multimedia");
    }
  };

const saveFileRecord = async ({
  filename,
  relativePath,
  slot,
  isAudio = false,
  photoData = null,
}) => {
  const { tipo } = getElementoInfo();

  const deficiency = await fetchDeficiencyByIdLocal(selectedDeficiency.id);

  // 🔒 GARANTÍA ABSOLUTA
  let archTipoFinal;

  if (isAudio) {
    archTipoFinal = 0;
  } else {
    archTipoFinal = Number.isInteger(slot) && slot > 0 ? slot : 1;
  }

  console.log(archTipoFinal);


  return await saveArchivoLocal({
    ArchInterno: null,

    // ⚠️ JAMÁS NULL
    ArchTipo: archTipoFinal,

    ArchTabla: "Deficiencias",

    ArchCodTabla:
      deficiency?.DefiServerId ?? selectedDeficiency.id,

    ArchNombre: `${relativePath}/${filename}`,

    ArchLatitud: photoData?.latUtm ?? null,
    ArchLongitud: photoData?.lonUtm ?? null,
    ArchFecha: photoData?.fechaISO ?? null,

    ArchTipoElemento:
      tipo.toUpperCase() === "POSTE" ? "POST" : "VANO",

    ArchIdElemento: selectedDeficiency.elementId,

    TipiInterno: selectedDeficiency?.typificationId ?? null,

    ArchActivo: 1,
  });
};

const ensureMediaPermission = async () => {
  const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

  if (status === "granted") return true;

  if (canAskAgain) {
    const result = await MediaLibrary.requestPermissionsAsync({
      accessPrivileges: "all",   // 👈 CLAVE
    });

    return result.status === "granted";
  }

  Alert.alert(
    "Permiso bloqueado",
    "Debes habilitar el acceso a la galería en Configuración > Aplicaciones > Permisos."
  );
  return false;
};

  /* ======================
     UI
  ====================== */
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== FOTOS ===== */}
        <View style={styles.section}>
          <Text style={styles.title}>📸 Registro de Fotos</Text>

          <View style={styles.grid}>
            {PHOTO_SLOTS.map((title, index) => (
              <PhotoCard
                key={index}
                title={title}
                uri={photos[index]?.uri}
                onPress={() => {
                  if (photos[index]?.uri) {
                    setPreviewPhoto(photos[index].uri);
                  } else {
                    setPhotoIndex(index);
                    setCameraModal(true);
                  }
                }}
                onDelete={() =>
                  setPhotos((prev) => {
                    const copy = [...prev];
                    copy[index] = null;
                    return copy;
                  })
                }
                onPreview={() => setPreviewPhoto(photos[index]?.uri)}
              />
            ))}
          </View>
        </View>

        {/* ===== AUDIO ===== */}
        <View style={styles.section}>
          <View style={styles.audioHeader}>
            <Text style={styles.title}>🎙️ Registro de Audio</Text>

            <TouchableOpacity
              style={styles.recButton}
              onPress={() => setAudioModal(true)}
            >
              <Text style={styles.recText}>● REC</Text>
            </TouchableOpacity>
          </View>

          {audios.length === 0 && (
            <Text style={styles.emptyAudio}>
              No hay audios grabados
            </Text>
          )}

          {audios.map((audio, index) => (
            <AudioCard
              key={index}
              title={audio.title}
              uri={audio.uri}
              onDelete={() =>
                Alert.alert(
                  "Eliminar audio",
                  `¿Desea eliminar ${audio.title}?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: () =>
                        setAudios((prev) =>
                          prev.filter((_, i) => i !== index)
                        ),
                    },
                  ]
                )
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* ===== FOOTER ===== */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButton} onPress={finalizar}>
          <Text style={styles.finishText}>FINALIZAR</Text>
        </TouchableOpacity>
      </View>

      {/* ===== PREVIEW FOTO ===== */}
      <Modal visible={!!previewPhoto} transparent>
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewPhoto }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.closePreview}
            onPress={() => setPreviewPhoto(null)}
          >
            <Text>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ===== MODALES ===== */}
      <ModalCamera
        visible={cameraModal}
        onClose={() => setCameraModal(false)}
        onPhoto={(photo) =>
          setPhotos((prev) => {
            const copy = [...prev];
            copy[photoIndex] = photo;
            return copy;
          })
        }
      />

      <ModalAudio
        visible={audioModal}
        onClose={() => setAudioModal(false)}
        onAudioRecorded={(uri) =>
          setAudios((prev) => [
            ...prev,
            {
              uri,
              title: `Audio ${prev.length + 1}`,
            },
          ])
        }
      />

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ======================
   ESTILOS
====================== */
const FOOTER_HEIGHT = 80;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },

  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: FOOTER_HEIGHT + 10,
  },

  section: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  audioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  recButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  recText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  emptyAudio: {
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },

  footer: {
    height: FOOTER_HEIGHT,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#F6F6F6",
  },

  finishButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  finishText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },

  closePreview: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    minWidth: 220,
  },

  loadingText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
