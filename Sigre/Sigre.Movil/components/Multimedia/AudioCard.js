import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

// ✅ NUEVO: expo-audio
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

export default function AudioCard({ uri, title: titleProp, onDelete, onPress }) {
  // ✅ Creamos el player una sola vez y vamos reemplazando la fuente
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    // Para que suene incluso si el iPhone está en silencio (si ya lo haces en otro lado, igual no molesta)
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    // Cada vez que cambie el uri, cargamos esa fuente
    if (uri) {
      player.replace(uri);
      player.seekTo(0);
      player.pause();
    }
    return () => {
      // Evita que siga sonando si el componente se desmonta
      player.pause();
    };
  }, [uri, player]);

  /* ======================
     TITULO FECHA / HORA
  ====================== */
  const title = useMemo(() => {
    if (titleProp) return titleProp;
    if (!uri) return "Audio";

    const match = uri.match(/(\d{13})/);
    const date = match ? new Date(Number(match[1])) : new Date();

    return `🎙️ ${date.toLocaleString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;
  }, [uri, titleProp]);

  const togglePlay = () => {
    try {
      if (!uri) {
        onPress?.();
        return;
      }

      if (status.playing) {
        player.pause();
        return;
      }

      // ✅ En expo-audio, al terminar NO se resetea solo: hay que hacer seekTo(0) para replay
      const dur = Number(status.duration || 0);
      const cur = Number(status.currentTime || 0);

      if (dur > 0 && cur >= dur - 0.05) {
        player.seekTo(0);
      }

      player.play();
    } catch (err) {
      console.error("Error reproduciendo audio", err);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Eliminar audio", "¿Seguro que deseas eliminar este audio?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí, eliminar",
        style: "destructive",
        onPress: () => {
          // opcional: parar antes de borrar
          try {
            player.pause();
            player.seekTo(0);
          } catch {}
          onDelete?.();
        },
      },
    ]);
  };

  const playing = !!status.playing;

  return (
    <View style={styles.card}>
      <Pressable style={styles.info} onPress={togglePlay}>
        <MaterialIcons
          name={playing ? "pause-circle-filled" : "play-circle-filled"}
          size={28}
          color="#2563EB"
        />
        <Text style={styles.title}>{title}</Text>
      </Pressable>

      {!!onDelete && (
        <Pressable onPress={confirmDelete} hitSlop={10}>
          <MaterialIcons name="delete" size={22} color="#d32f2f" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
  },
});