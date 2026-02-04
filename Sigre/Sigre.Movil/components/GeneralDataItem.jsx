// components/GeneralDataItem.js
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePost } from "../hooks/usePost"; // ✅ usa tu hook real

const pickFirst = (obj, keys, fallback = "") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return fallback;
};

const asSiNo = (v) => (Number(v) === 1 || v === true ? "SÍ" : "NO");
const k = (v) => String(v ?? "").trim();

export default function GeneralDataItem({ item, onEdit }) {
  const { getMaterialsPost, getTipoRetenidasPost } = usePost();

  const [postMaterials, setPostMaterials] = useState([]);
  const [retenidaTipos, setRetenidaTipos] = useState([]);

  // ✅ cargar catálogos (una vez)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const mats = (await getMaterialsPost()) ?? [];
        const rets = (await getTipoRetenidasPost()) ?? [];
        if (!alive) return;

        setPostMaterials(mats);
        setRetenidaTipos(rets);
      } catch (e) {
        // si falla, solo se verá "-"
        console.warn("GeneralDataItem: no se pudieron cargar catálogos", e?.message ?? e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ maps id -> nombre
  const materialNameById = useMemo(() => {
    const map = new Map();
    for (const m of postMaterials) {
      map.set(k(m?.PosmtInterno), String(m?.PosmtNombre ?? "").trim());
    }
    return map;
  }, [postMaterials]);

  const retenidaNameById = useMemo(() => {
    const map = new Map();
    for (const r of retenidaTipos) {
      map.set(k(r?.RtntpInterno), String(r?.RtntpNombre ?? "").trim());
    }
    return map;
  }, [retenidaTipos]);

  const info = useMemo(() => {
    const isPost = item?.PostInterno != null;
    const isVano =
      item?.VanoInterno != null ||
      item?.Vano_Codigo != null ||
      item?.VanoCodigo != null;

    if (isPost) {
      const codigo = pickFirst(item, ["PostCodigoNodo"], "UNK");
      const etiqueta = pickFirst(item, ["PostEtiqueta"], "");

      // IDs (guardados en el elemento)
      const materialId = pickFirst(item, ["PostMaterial"], "");
      const retenidaId = pickFirst(item, ["PostRetenidaTipo"], "");

      // nombres (si por alguna razón ya vinieran)
      const materialFromProps = pickFirst(item, ["PostMaterialNombre", "PosmtNombre"], "");
      const retenidaFromProps = pickFirst(item, ["PostRetenidaTipoNombre", "RtntpNombre"], "");

      // ✅ nombre real desde catálogos
      const material =
        materialFromProps ||
        materialNameById.get(k(materialId)) ||
        "-";

      const retenida =
        retenidaFromProps ||
        retenidaNameById.get(k(retenidaId)) ||
        "-";

      const alturaRaw = pickFirst(item, ["PostAltura"], "");
      const altura = alturaRaw === "" || alturaRaw == null ? "-" : String(alturaRaw);

      const terceros = asSiNo(pickFirst(item, ["PostTerceros"], 0));

      const title = `POSTE: ${codigo}` + (etiqueta ? ` - ${etiqueta}` : "");

      const lines = [
        `Material: ${material}`,
        `Retenida: ${retenida}`,
        `Altura: ${altura}`,
        `Terceros: ${terceros}`,
      ];

      return { title, lines };
    }

    if (isVano) {
      const codigo = pickFirst(item, ["VanoCodigo", "Vano_Codigo", "VanoCodigoNodo"], "UNK");
      const etiqueta = pickFirst(item, ["VanoEtiqueta"], "");

      const nodoIni = pickFirst(item, ["VanoNodoInicial"], "-");
      const nodoFin = pickFirst(item, ["VanoNodoFinal"], "-");
      const terceros = asSiNo(pickFirst(item, ["VanoTerceros"], 0));

      const title = `VANO: ${codigo}` + (etiqueta ? ` - ${etiqueta}` : "");

      const lines = [
        `Nodo inicial: ${nodoIni}`,
        `Nodo final: ${nodoFin}`,
        `Terceros: ${terceros}`,
      ];

      return { title, lines };
    }

    const codigo = pickFirst(item, ["SedCodigo", "SED_Codigo", "SedInterno"], "UNK");
    return { title: `SED: ${codigo}`, lines: [] };
  }, [item, materialNameById, retenidaNameById]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {info.title}
        </Text>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit?.(item)}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {info.lines.length > 0 && (
        <View style={styles.lines}>
          {info.lines.map((t, idx) => (
            <Text key={idx} style={styles.lineText}>
              {t}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { flex: 1, fontSize: 16, fontWeight: "800" },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  lines: { marginTop: 8, gap: 2 },
  lineText: { fontSize: 14, color: "#333" },
});
