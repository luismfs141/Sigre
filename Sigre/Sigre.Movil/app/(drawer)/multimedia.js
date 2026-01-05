import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useContext, useState } from "react";
import {
  Alert,
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
  const [audios, setAudios] = useState([]); // 🎧 lista dinámica

  const [photoIndex, setPhotoIndex] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);


  // useEffect(() => {
  //   loadMedios();
  // }, [selectedDeficiency?.id]);

  useFocusEffect(
    useCallback(() => {
      loadMedios();

      return () => {
        // opcional: cleanup
      };
    }, [selectedDeficiency?.id])
  );


  const loadMedios = async () => {
    // 🧹 LIMPIAR SIEMPRE ANTES DE CARGAR
    setPhotos(Array(6).fill(null));
    setAudios([]);

    try {
      if (!selectedDeficiency?.id) return;

      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);

      const deficienciaId =
        deficiencia.DefiServerId ?? deficiencia.DefiInterno;

      const medios = await fetchMediosByDeficienciaId(deficienciaId);

      const activos = medios.filter(
        m => Number(m.ArchActivo) === 1
      );

      const photosTmp = Array(6).fill(null);
      const audiosTmp = [];

      for (const m of activos) {
        const filename = m.ArchNombre.split("/").pop();

        // 🎙️ AUDIO → MUSIC
        if (Number(m.ArchTipo) === 0) {
          const uri = await getAssetUriByFilename(
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

        // 📸 FOTO → PICTURES
        if (Number(m.ArchTipo) > 0 && Number(m.ArchTipo) <= 6) {
          const uri = await getAssetUriByFilename(
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

      setPhotos(photosTmp);
      setAudios(audiosTmp);

    } catch (err) {
      console.error("❌ Error cargando medios:", err);
    }
  };


  const getAssetUriByFilename = async (filename, mediaType) => {
    let after = null;

    do {
      const page = await MediaLibrary.getAssetsAsync({
        mediaType,
        first: 100,
        after,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      const asset = page.assets.find(a => a.filename === filename);
      if (asset) return asset.uri;

      after = page.endCursor;
    } while (after);

    return null;
  };


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

  const getFilenameFromUri = (uri) => {
    if (!uri) return null;
    return uri.split("/").pop();
  };

  const moveToAlbum = async (uri, albumName, filename) => {
    // 1️⃣ Pedir permisos
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Se requiere acceso a la galería");
      return;
    }

    // 2️⃣ Carpeta temporal
    const tempDir = FileSystem.cacheDirectory + "SigreMovil/";
    const folderInfo = await FileSystem.getInfoAsync(tempDir);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    }

    // 3️⃣ Copiar archivo con nombre deseado
    const localUri = `${tempDir}${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: localUri,
    });

    // 4️⃣ Crear asset en la galería
    const asset = await MediaLibrary.createAssetAsync(localUri);

    // 5️⃣ Crear o agregar álbum
    let album = await MediaLibrary.getAlbumAsync(albumName);
    if (!album) {
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    console.log("Foto guardada en álbum:", filename);
  };

  const moveAudio = async (uri, albumName) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Se requiere acceso a la galería");
      return;
    }

    try {
      // ✔ SIEMPRE se guarda el audio
      const asset = await MediaLibrary.createAssetAsync(uri);

      try {
        const album = await MediaLibrary.getAlbumAsync(albumName);

        if (!album) {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumError) {
        // ⚠️ ERROR ESPERADO EN ANDROID (NO ROMPE FLUJO)
        console.warn(
          "⚠️ No se pudo crear álbum para audio, continuando...",
          albumError?.message
        );
      }
    } catch (err) {
      console.error("❌ Error guardando audio:", err);
    }
  };

  /* ======================
     FINALIZAR
  ====================== */
  const finalizar = async () => {

    let feeder = await findFeederById(selectedSed.AlimInterno);
    if (!selectedItem)
      return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      const { tipo, codigo } = getElementoInfo();

      const folderBase = `SigreMovil/${feeder.alimEtiqueta}/${selectedSed.SedCodigo}/${tipo}/${codigo}/${selectedDeficiency.typificationCode}`;
      const folderFinal = selectedDeficiency.numSuministro ? `${folderBase}/${selectedDeficiency.numSuministro}` : folderBase;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri) {
          const filename = `${i + 1}.jpg`; // índice
          await moveToAlbum(photo.uri, folderFinal, filename);

          await saveFileRecord({
            filename,
            relativePath: folderFinal,
            slot: i + 1,
            isAudio: false,
            photoData: photo 
          });
        }
      }

      for (const audio of audios) {
        if (audio?.uri) {
          const filename = getFilenameFromUri(audio.uri); 

          await moveAudio(audio.uri, folderFinal);

          await saveFileRecord({
            filename, 
            relativePath: folderFinal,
            slot: 0,
            isAudio: true
          });
        }
      }

      setPhotos(Array(6).fill(null));
      setAudios([]);

      Alert.alert("Éxito", "Multimedia guardada correctamente");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo guardar la multimedia");
    }
  };

  const saveFileRecord = async ({
    filename,
    relativePath,
    slot,
    isAudio = false,
    photoData = null
  }) => {
    const { tipo } = getElementoInfo();
    const deficiency = await fetchDeficiencyByIdLocal(selectedDeficiency.id);

    return await saveArchivoLocal({
      ArchInterno: null,

      archTipo: isAudio ? 0 : slot,
      archTabla: "Deficiencias",
      archCodTabla: deficiency.DefiServerId??selectedDeficiency.id,

      archNombre: `${relativePath}/${filename}`,

      // 📍 UTM DESDE LA FOTO
      archLatit: photoData?.latUtm ?? 0,
      archLong: photoData?.lonUtm ?? 0,

      // 📅 FECHA REAL DE CAPTURA
      archFech: photoData?.fechaISO ?? null,

      archTipoElemento: tipo.toUpperCase() === "POSTE" ? "POST" : "VANO",
      archIdElemento: selectedDeficiency.elementId,
      tipiInterno: selectedDeficiency?.typificationId ?? null,
      archActiv: 1
    });
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
});
