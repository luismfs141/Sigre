// import { MaterialIcons } from "@expo/vector-icons";
// import { Audio } from "expo-av";
// import { useEffect, useMemo, useState } from "react";
// import { Pressable, StyleSheet, Text, View } from "react-native";

// export default function AudioCard({ uri, onDelete, onPress }) {
//   const [sound, setSound] = useState(null);
//   const [playing, setPlaying] = useState(false);

//   useEffect(() => {
//     return () => {
//       if (sound) {
//         sound.unloadAsync();
//       }
//     };
//   }, [sound]);

//   /* ======================
//      TITULO FECHA / HORA
//   ====================== */
//   const title = useMemo(() => {
//     if (!uri) return "Audio";

//     // Intentar obtener timestamp del nombre del archivo
//     const match = uri.match(/(\d{13})/); // timestamp en ms
//     const date = match
//       ? new Date(Number(match[1]))
//       : new Date();

//     return `🎙️ ${date.toLocaleString("es-PE", {
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//     })}`;
//   }, [uri]);

//   const togglePlay = async () => {
//     try {
//       if (!uri) {
//         onPress?.();
//         return;
//       }

//       if (!sound) {
//         const { sound: newSound } = await Audio.Sound.createAsync(
//           { uri },
//           { shouldPlay: true }
//         );

//         newSound.setOnPlaybackStatusUpdate((status) => {
//           if (!status.isLoaded) return;
//           setPlaying(status.isPlaying);

//           if (status.didJustFinish) {
//             newSound.unloadAsync();
//             setSound(null);
//             setPlaying(false);
//           }
//         });

//         setSound(newSound);
//         setPlaying(true);
//         return;
//       }

//       if (playing) {
//         await sound.pauseAsync();
//       } else {
//         await sound.playAsync();
//       }
//     } catch (err) {
//       console.error("Error reproduciendo audio", err);
//     }
//   };

//   return (
//     <View style={styles.card}>
//       <Pressable style={styles.info} onPress={togglePlay}>
//         <MaterialIcons
//           name={playing ? "pause-circle-filled" : "play-circle-filled"}
//           size={28}
//           color="#2563EB"
//         />
//         <Text style={styles.title}>{title}</Text>
//       </Pressable>

//       <Pressable onPress={onDelete}>
//         <MaterialIcons name="delete" size={22} color="#d32f2f" />
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     width: "100%",
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 10,
//     elevation: 2,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   info: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   title: {
//     fontSize: 14,
//     fontWeight: "500",
//   },
// });



import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function AudioCard({ uri, title: titleProp, onDelete, onPress }) {

  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  /* ======================
     TITULO FECHA / HORA
  ====================== */
  const title = useMemo(() => {
    // ✅ Si te pasan un título desde afuera (Multimedia), úsalo
    if (titleProp) return titleProp;

    if (!uri) return "Audio";

    const match = uri.match(/(\d{13})/); // timestamp en ms
    const date = match ? new Date(Number(match[1])) : new Date();

    return `🎙️ ${date.toLocaleString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;
  }, [uri, titleProp]);


  const togglePlay = async () => {
    try {
      if (!uri) {
        onPress?.();
        return;
      }

      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setPlaying(status.isPlaying);

          if (status.didJustFinish) {
            newSound.unloadAsync();
            setSound(null);
            setPlaying(false);
          }
        });

        setSound(newSound);
        setPlaying(true);
        return;
      }

      if (playing) await sound.pauseAsync();
      else await sound.playAsync();
    } catch (err) {
      console.error("Error reproduciendo audio", err);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Eliminar audio",
      "¿Seguro que deseas eliminar este audio?",
      [
        { text: "No", style: "cancel" },
        { text: "Sí, eliminar", style: "destructive", onPress: onDelete },
      ]
    );
  };

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

      {/* ✅ Solo mostramos el tacho si existe onDelete */}
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
