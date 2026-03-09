import { MaterialIcons } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function AudioCard(props) {
  // ✅ Si no hay uri (placeholder), NO creamos AudioPlayer (evita useAudioPlayer(null))
  if (!props?.uri) return <AudioCardPlaceholder {...props} />;
  return <AudioCardPlayer {...props} />;
}

function AudioCardPlaceholder({ title: titleProp, onDelete, onPress }) {
  const title = titleProp || "🎙️ AUDIO NO DISPONIBLE EN ESTE DISPOSITIVO";

  const confirmDelete = () => {
    Alert.alert("Eliminar audio", "¿Seguro que deseas eliminar este audio?", [
      { text: "No", style: "cancel" },
      { text: "Sí, eliminar", style: "destructive", onPress: () => onDelete?.() },
    ]);
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.info}
        onPress={() => {
          if (onPress) return onPress();
          Alert.alert(
            "Audio no disponible",
            "La BD tiene el registro, pero el archivo no está en la carpeta pública (Music)."
          );
        }}
      >
        <MaterialIcons name="play-circle-filled" size={28} color="#9CA3AF" />
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

function AudioCardPlayer({ uri, title: titleProp, onDelete, onPress }) {
  // ✅ Creamos el player directamente con source real (NO null + replace)
  const player = useAudioPlayer(uri, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const title = useMemo(() => {
    if (titleProp) return titleProp;
    if (!uri) return "Audio";

    const match = String(uri).match(/(\d{13})/);
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

      // replay cuando ya terminó
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
          // parar antes de borrar (try/catch para no reventar si el player se liberó por navegación)
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