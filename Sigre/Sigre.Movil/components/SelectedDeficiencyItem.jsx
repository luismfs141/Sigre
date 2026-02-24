import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function SelectedDeficiencyItem({
  item,
  onDelete,
  onPhotos,
  onDeficiency,
  canDelete = true,
  containerStyle = null,
}) {


  const [infoVisible, setInfoVisible] = useState(false);

  const code = String(item?.data?.typificationCode ?? "").trim();
  const showInfo = code !== "0000"; // ✅ ocultar en Sin Deficiencia

  const infoTipificacion = item?.data?.infoTipificacion ?? code;
  const infoDeficiencia = item?.data?.infoDeficiencia ?? "";
  const infoDescripcion = item?.data?.infoDescripcion ?? "";


  return (
    <View style={[styles.card, containerStyle]}>

      {/* ✅ BOTÓN INFO (arriba derecha) */}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.order ?? "-"}</Text>
      </View>


      {/* opcional: muestra también # dentro del mismo código */}
      {String(item?.data?.typificationCode ?? "") !== "0000" && item.orderInCode > 1 && (
        <Text style={styles.badgeMini}>#{item.orderInCode}</Text>
      )}

      {showInfo && (
        <Pressable
          style={styles.infoBtn}
          onPress={() => setInfoVisible(true)}
          hitSlop={10}
        >
          <MaterialIcons name="info-outline" size={20} color="#1976d2" />
        </Pressable>
      )}


      {/* 🔹 Título */}
      <Text style={styles.title} numberOfLines={3}>
        {item.name}
      </Text>

      {item.data && (
        <View style={styles.infoBlock}>
          <Text style={styles.subtitle} numberOfLines={2}>
            <Text style={styles.labelInline}>Observación: </Text>
            {item.data.observacion?.trim() ? item.data.observacion : "-"}
          </Text>

          <Text style={styles.subtitle} numberOfLines={2}>
            <Text style={styles.labelInline}>Comentario: </Text>
            {item.data.comentario?.trim() ? item.data.comentario : "-"}
          </Text>

          <Text style={styles.subtitle}>
            <Text style={styles.labelInline}>Dist. vertical: </Text>
            {item.data.distVertical ?? 0}
            {"   "}
            <Text style={styles.labelInline}>Dist. horizontal: </Text>
            {item.data.distHorizontal ?? 0}
          </Text>
        </View>
      )}

      {/* 🔹 BOTONES */}
      <View style={styles.actions}>
        <Pressable
          style={[
            styles.button,
            styles.delete,
            !canDelete && styles.disabledBtn
          ]}
          onPress={() => {
            if (!canDelete) return;
            onDelete(item);
          }}
        >
          <MaterialIcons name="delete" size={18} color={canDelete ? "#d32f2f" : "#999"} />
          <Text style={[styles.deleteText, !canDelete && styles.disabledText]}>
            Eliminar
          </Text>
        </Pressable>


        <Pressable style={styles.button} onPress={() => onPhotos(item)}>
          <MaterialIcons name="photo-camera" size={18} color="#1976d2" />
          <Text style={styles.actionText}>Fotos</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => onDeficiency(item)}>
          <MaterialIcons name="warning" size={18} color="#ed6c02" />
          <Text style={styles.actionText}>Def.</Text>
        </Pressable>
      </View>

      {/* ✅ MODAL INFO */}
      {showInfo && (
        <Modal
          visible={infoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoVisible(false)}
        >
          <Pressable style={styles.infoOverlay} onPress={() => setInfoVisible(false)}>
            <Pressable style={styles.infoBox} onPress={() => { }}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTitle}>Información</Text>

                <Pressable onPress={() => setInfoVisible(false)} hitSlop={10}>
                  <Text style={styles.close}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Tipificación: </Text>
                {infoTipificacion || "-"}
              </Text>

              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Deficiencia: </Text>
                {infoDeficiencia?.trim() ? infoDeficiencia : "-"}
              </Text>

              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Descripción: </Text>
                {infoDescripcion?.trim() ? infoDescripcion : "-"}
              </Text>

              <Pressable style={styles.btnClose} onPress={() => setInfoVisible(false)}>
                <Text style={styles.btnCloseText}>Cerrar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2
  },

  // ✅ botón info
  infoBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10
  },

  title: {
    fontWeight: "600",
    fontSize: 15,
    paddingRight: 26 // para que no choque con el botón info
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2
  },

  actions: {
    flexDirection: "row",
    marginTop: 8
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6
  },
  delete: {
    borderRightWidth: 1,
    borderColor: "#eee"
  },
  deleteText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 2
  },
  actionText: {
    fontSize: 12,
    marginTop: 2
  },
  infoBlock: {
    marginTop: 4,
    marginBottom: 8
  },
  labelInline: {
    fontWeight: "700",
    color: "#666"
  },

  // ✅ modal info
  infoOverlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: 16
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10
  },
  infoTitle: {
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
    paddingRight: 10
  },
  close: {
    fontSize: 20,
    fontWeight: "700",
    color: "#555"
  },
  infoDesc: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18
  },
  btnClose: {
    marginTop: 14,
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center"
  },
  btnCloseText: {
    color: "#fff",
    fontWeight: "700"
  },
  infoLine: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    lineHeight: 18
  },
  infoLabel: {
    fontWeight: "700",
    color: "#333"
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1976d2",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12
  },

  // opcional: para mostrar #2, #3...
  badgeMini: {
    position: "absolute",
    top: 12,
    left: 40,
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "700"
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    paddingLeft: 34,   // ✅ deja espacio para el badge
    paddingRight: 26   // ✅ deja espacio para el botón info
  },
  disabledBtn: {
    opacity: 0.35
  },
  disabledText: {
    color: "#999"
  },


});
