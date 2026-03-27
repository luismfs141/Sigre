import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePost } from "../hooks/usePost";

const pickFirst = (obj, keys, fallback = "") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return fallback;
};

const k = (v) => String(v ?? "").trim();

const asExisteSiNo = (v) => {
  if (v === null || v === undefined || String(v).trim() === "") return "-";
  return Number(v) === 1 || v === true ? "NO" : "SÍ";
};

const asDirectSiNo = (v) => {
  if (v === null || v === undefined || String(v).trim() === "") return "-";
  return Number(v) === 1 || v === true ? "SÍ" : "NO";
};

export default function GeneralDataItem({ item, onEdit }) {
  const { getMaterialsPost, getTipoRetenidasPost } = usePost();

  const [postMaterials, setPostMaterials] = useState([]);
  const [retenidaTipos, setRetenidaTipos] = useState([]);







  const isPost = item?.PostInterno != null;
  const isVano =
    item?.VanoInterno != null ||
    item?.Vano_Codigo != null ||
    item?.VanoCodigo != null;









  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!isPost) {
          if (!alive) return;

          setPostMaterials((prev) => (prev.length ? [] : prev));
          setRetenidaTipos((prev) => (prev.length ? [] : prev));
          return;
        }

        const mats = (await getMaterialsPost()) ?? [];
        const rets = (await getTipoRetenidasPost()) ?? [];
        if (!alive) return;

        setPostMaterials(mats);
        setRetenidaTipos(rets);
      } catch (e) {
        console.warn("GeneralDataItem: no se pudieron cargar catálogos", e?.message ?? e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isPost]);



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


    if (isPost) {
      const codigo = pickFirst(item, ["PostCodigoNodo"], "UNK");
      const etiqueta = pickFirst(item, ["PostEtiqueta"], "");

      const materialId = pickFirst(item, ["PostMaterial"], "");
      const retenidaId = pickFirst(item, ["PostRetenidaTipo"], "");

      const materialFromProps = pickFirst(item, ["PostMaterialNombre", "PosmtNombre"], "");
      const retenidaFromProps = pickFirst(item, ["PostRetenidaTipoNombre", "RtntpNombre"], "");

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

      const postTerceros = pickFirst(item, ["PostTerceros"], null);
      const postVereda = pickFirst(item, ["PostVereda"], null);

      const title = `POSTE: ${codigo}` + (etiqueta ? ` - ${etiqueta}` : "");
      const isDanger = Number(postTerceros) === 1 || postTerceros === true;

      const lines = [
        `Material del poste: ${material}`,
        `Tipo de retenida: ${retenida}`,
        `Altura: ${altura}`,
        `Poste en vereda: ${asDirectSiNo(postVereda)}`,
        `Poste existente: ${asExisteSiNo(postTerceros)}`,
      ];

      return { title, lines, isDanger };
    }

    if (isVano) {
      const codigo = pickFirst(item, ["VanoCodigo", "Vano_Codigo", "VanoCodigoNodo"], "UNK");
      const etiqueta = pickFirst(item, ["VanoEtiqueta"], "");

      const nodoIni = pickFirst(item, ["VanoNodoInicial"], "-");
      const nodoFin = pickFirst(item, ["VanoNodoFinal"], "-");

      const vanoTerceros = pickFirst(item, ["VanoTerceros"], null);
      const terceros = asExisteSiNo(vanoTerceros);

      const title = `VANO: ${codigo}` + (etiqueta ? ` - ${etiqueta}` : "");
      const isDanger = Number(vanoTerceros) === 1 || vanoTerceros === true;

      const lines = [
        `Nodo inicial: ${nodoIni}`,
        `Nodo final: ${nodoFin}`,
        `Red existe: ${terceros}`,
      ];

      return { title, lines, isDanger };
    }

    const codigo = pickFirst(item, ["SedCodigo", "SED_Codigo", "SedInterno"], "UNK");
    return { title: `SED: ${codigo}`, lines: [], isDanger: false };
  }, [item, materialNameById, retenidaNameById]);

  const textColor = info.isDanger ? "#D32F2F" : "#111";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
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
            <Text key={idx} style={[styles.lineText, { color: textColor }]}>
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
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
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
  lines: {
    marginTop: 8,
    gap: 2,
  },
  lineText: {
    fontSize: 14,
  },
});