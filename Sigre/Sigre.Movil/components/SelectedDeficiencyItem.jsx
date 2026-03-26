import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const CRITICIDAD_MAP = {
  1: "Leve",
  3: "Crítico",
};

const ACCESIBILIDAD_MAP = {
  1: "Accesible",
  2: "No accesible",
};

const TIPO_CRUCE_MAP = {
  1: "Calle",
  2: "Avenida",
  3: "Cruce de trenes",
  4: "Longitudinal un piso",
  5: "Longitudinal cochera",
};

const toText = (value) => {
  if (value === 0) return "0";
  if (value === false) return "NO";
  if (value === true) return "SÍ";
  if (value === null || value === undefined) return "-";

  const s = String(value).trim();
  return s === "" ? "-" : s;
};

const buildRows = (item) => {
  const data = item?.data ?? {};
  const code = String(data?.typificationCode ?? "").trim();

  const criticidad = CRITICIDAD_MAP[Number(data?.criticidad)] ?? "-";
  const accesibilidad = ACCESIBILIDAD_MAP[Number(data?.accesibilidad)] ?? "-";
  const tipoCruce = TIPO_CRUCE_MAP[Number(data?.tipoCruce)] ?? "-";

  const observacion = toText(data?.observacion);
  const comentario = toText(data?.comentario);
  const comentarioEstandar = toText(data?.comentarioEstandar);
  const opcion = toText(data?.opcionLabel);
  const distVertical = toText(data?.distVertical);
  const distHorizontal = toText(data?.distHorizontal);

  if (code === "0000") {
    return [
      { label: "Opción", value: opcion },
      { label: "Comentario", value: comentario },
    ];
  }

  if (code === "7002" || code === "7004") {
    return [
      { label: "Criticidad", value: criticidad },
      { label: "Distancia horizontal", value: distHorizontal },
      { label: "Accesibilidad", value: accesibilidad },
      { label: "Distancia vertical", value: distVertical },
      { label: "Observación", value: observacion },
      { label: "Comentario estándar", value: comentarioEstandar },
      { label: "Opción", value: opcion },
      { label: "Comentario", value: comentario },
    ];
  }

  if (code === "7006") {
    return [
      { label: "Criticidad", value: criticidad },
      { label: "Tipo de cruce", value: tipoCruce },
      { label: "Distancia vertical", value: distVertical },
      { label: "Observación", value: observacion },
      { label: "Comentario estándar", value: comentarioEstandar },
      { label: "Opción", value: opcion },
      { label: "Comentario", value: comentario },
    ];
  }

  if (code === "7008") {
    return [
      { label: "Criticidad", value: criticidad },
      { label: "Distancia horizontal", value: distHorizontal },
      { label: "Observación", value: observacion },
      { label: "Comentario estándar", value: comentarioEstandar },
      { label: "Opción", value: opcion },
      { label: "Comentario", value: comentario },
    ];
  }

  return [
    { label: "Criticidad", value: criticidad },
    { label: "Observación", value: observacion },
    { label: "Comentario estándar", value: comentarioEstandar },
    { label: "Opción", value: opcion },
    { label: "Comentario", value: comentario },
  ];
};

export default function SelectedDeficiencyItem({
  item,
  onDelete,
  onPhotos,
  onDeficiency,
  canDelete = true,
  containerStyle = null,
}) {
  const [infoVisible, setInfoVisible] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const code = String(item?.data?.typificationCode ?? "").trim();
  const showInfo = code !== "0000";

  const infoTipificacion = item?.data?.infoTipificacion ?? code;
  const infoDeficiencia = item?.data?.infoDeficiencia ?? "";
  const infoDescripcion = item?.data?.infoDescripcion ?? "";

  const rows = useMemo(() => buildRows(item), [item]);
  const hasRows = rows.length > 0;

  return (
    <View style={[styles.card, containerStyle]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.order ?? "-"}</Text>
      </View>

      {showInfo && (
        <Pressable
          style={styles.infoBtn}
          onPress={() => setInfoVisible(true)}
          hitSlop={10}
        >
          <MaterialIcons name="info-outline" size={20} color="#1976d2" />
        </Pressable>
      )}

      <Text style={styles.title} numberOfLines={3} ellipsizeMode="tail">
        {item.name}
      </Text>

      {!!item?.data?.numSuministro && (
        <Text style={styles.suministroText}>
          Suministro: {item.data.numSuministro}
        </Text>
      )}



      {detailsExpanded && hasRows && (
        <View style={styles.infoBlock}>
          {rows.map((row, idx) => (
            <Text key={`${row.label}-${idx}`} style={styles.subtitle}>
              <Text style={styles.labelInline}>{row.label}: </Text>
              {row.value}
            </Text>
          ))}
        </View>
      )}

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

        {hasRows && (
          <Pressable
            style={styles.button}
            onPress={() => setDetailsExpanded((prev) => !prev)}
          >
            <MaterialIcons
              name={detailsExpanded ? "expand-less" : "expand-more"}
              size={18}
              color="#1976d2"
            />
            <Text style={styles.actionText}>
              {detailsExpanded ? "Ocultar" : "Detalle"}
            </Text>
          </Pressable>
        )}
      </View>

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
    elevation: 2,
  },
  infoBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    paddingLeft: 34,
    paddingRight: 26,
  },
  suministroText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "700",
    marginTop: 4,
    paddingLeft: 34,
    paddingRight: 26,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  delete: {
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  deleteText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 2,
  },
  actionText: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBlock: {
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  labelInline: {
    fontWeight: "700",
    color: "#666",
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: 16,
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoTitle: {
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
    paddingRight: 10,
  },
  close: {
    fontSize: 20,
    fontWeight: "700",
    color: "#555",
  },
  btnClose: {
    marginTop: 14,
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnCloseText: {
    color: "#fff",
    fontWeight: "700",
  },
  infoLine: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    lineHeight: 18,
  },
  infoLabel: {
    fontWeight: "700",
    color: "#333",
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
    zIndex: 10,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  disabledBtn: {
    opacity: 0.35,
  },
  disabledText: {
    color: "#999",
  },
});