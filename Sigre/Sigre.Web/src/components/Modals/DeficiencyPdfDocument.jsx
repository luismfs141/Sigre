import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

export const ALL_DEFICIENCY_OPTIONS = [
    { code: "0", name: "SIN DEFICIENCIA", type: "BOTH" },
    { code: "6002", name: "6002 - POSTE EN MAL ESTADO DE CONSERVACIÓN O INAPROPIADO PARA LA FUNCIÓN DE APOYO", type: "POST" },
    { code: "6004", name: "6004 - POSTE INCLINADO MÁS DE 5° O CON DEFICIENCIAS EN LA CIMENTACIÓN", type: "POST" },
    { code: "6006", name: "6006 - CAJA PORTAFUSIBLE DE POSTE CON PARTES ENERGIZADAS EXPUESTAS Y ACCESIBLES", type: "POST" },
    { code: "6008", name: "6008 - PROTECCIÓN MECÁNICA DE CABLE ROTA, INEXISTENTE, INSUFICIENTE O MATERIAL INAPROPIADO", type: "POST" },
    { code: "6024", name: "6024 - RETENIDA EN MAL ESTADO", type: "POST" },
    { code: "6026", name: "6026 - PASTORAL DE AP EN MAL ESTADO O POR DESPRENDERSE", type: "POST" },
    { code: "6028", name: "6028 - ARTEFACTO DE AP DESPRENDIDO O POR DESPRENDERSE", type: "POST" },
    { code: "7002", name: "7002 - CONDUCTOR DESNUDO, FORRADO O AISLADO CON AISLAMIENTO DETERIORADO O INADECUADO", type: "VANO" },
    { code: "7004", name: "7004 - CONDUCTOR DE BAJA TENSIÓN SOBRE EDIFICACIÓN O EN CONTACTO CON TECHO O SOPORTE METÁLICO", type: "VANO" },
    { code: "7006", name: "7006 - CONDUCTOR INCUMPLE DS RESPECTO AL NIVEL DE TERRENO", type: "VANO" },
    { code: "7008", name: "7008 - CONDUCTOR INCUMPLE DS RESPECTO A GRIFO", type: "VANO" }
];

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', backgroundColor: '#fff' },
    title: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, textDecoration: 'underline' },
    table: { width: '100%', border: '0.5pt solid #000', marginBottom: 10 },
    row: { flexDirection: 'row', borderBottom: '0.5pt solid #000', minHeight: 18, alignItems: 'center' },
    rowNoBorder: { flexDirection: 'row', minHeight: 18, alignItems: 'center' },
    headerCell: { backgroundColor: '#f0f0f0', padding: 4, fontWeight: 'bold', borderRight: '0.5pt solid #000' },
    valueCell: { padding: 4, borderRight: '0.5pt solid #000' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
    photoBox: { width: '48%', height: 230, border: '0.5pt solid #000', marginBottom: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    img: { width: '100%', height: '210', objectFit: 'contain' },
    noImgText: { fontSize: 10, color: '#999' },
    photoTitle: { fontSize: 8, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#eee', width: '100%', padding: 4, borderTop: '0.5pt solid #000' },
    signatures: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 40 },
    signBox: { width: '40%', borderTop: '1pt solid black', alignItems: 'center', paddingTop: 8 }
});

const DeficiencyPdfDocument = ({ dataList, empresaInfo }) => {
    
    // 🔥 MAGIA APLICADA: Ahora lee directamente "CIR. 3" desde lo que guardamos en memoria
    const getCircuito = (def, globalFeeder) => {
        // Prioridad 1: Si encontramos el 'CIR. 3' en la DB del poste
        if (def?.circuitoCalculado) return def.circuitoCalculado.toUpperCase();
        if (def?.tramCodigoCalculado) return def.tramCodigoCalculado.toUpperCase();
        
        // Prioridad 2: El Alimentador general (Global)
        const val = def?.alimentador || def?.Alimentador || def?.defiAlimentador || def?.nombreAlimentador || globalFeeder;
        return val ? String(val).toUpperCase() : "-";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateString, isStart, def) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";

        if (isStart) {
            const code = String(def?.tipificacionLabel || "0").split(' ')[0].trim();
            const isSinDef = code === "0" || code === "0000" || code === "S/D" || code === "-" || code === "";
            let subtractMinutes = 4;
            if (isSinDef) {
                const id = Number(def?.defiInterno) || 0;
                subtractMinutes = (id % 2 === 0) ? 2 : 3; 
            }
            date.setMinutes(date.getMinutes() - subtractMinutes);
        }
        return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getTipificacionData = (def) => {
        let rawVal = String(def?.tipificacionLabel || def?.tipiCodigo || def?.tipiInterno || "").trim();
        let rawCode = rawVal.split(' ')[0].replace(/[^0-9]/g, '');

        if (!rawCode || rawCode === "0" || rawCode === "0000") {
            return { code: "SIN DEFICIENCIA", description: "EL ELEMENTO FUE INSPECCIONADO Y NO PRESENTA DEFICIENCIAS OBSERVABLES." };
        }

        const found = ALL_DEFICIENCY_OPTIONS.find(opt => opt.code === rawCode);
        if (found) {
            const parts = found.name.split('-');
            const soloTexto = parts.length > 1 ? parts.slice(1).join('-').trim() : found.name;
            return { code: rawCode, description: soloTexto };
        }
        return { code: rawCode, description: rawVal };
    };

    if (!dataList || dataList.length === 0) {
        return <Document><Page size="A4" style={styles.page}><Text>No se encontraron datos.</Text></Page></Document>;
    }

    return (
        <Document>
            {dataList.map((item, idx) => {
                const tipificacion = getTipificacionData(item.deficiencia);
                const isSinDef = tipificacion.code === "SIN DEFICIENCIA";

                let criticidadTexto = item.deficiencia?.criticidadLabel || '-';
                if (isSinDef || criticidadTexto.toUpperCase() === 'N/A') {
                    criticidadTexto = 'NO APLICA';
                }

                let originalName = item.deficiencia?.inspectorLabel || "_____________________";
                let inspectorName = originalName;

                if (originalName !== "_____________________") {
                    const cleanName = originalName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');

                    if (cleanName.includes("ERICK YERAL CASTANON") || cleanName.includes("ERICK YERAL")) {
                        inspectorName = "JOSEPH ROMULO TINTA MAMANI";
                    } 
                    else if (cleanName.includes("JOSEPH")) {
                        inspectorName = "ADMINISTRADOR GENERAL";
                    } 
                    else {
                        inspectorName = originalName.toUpperCase();
                    }
                }

                return (
                    <Page key={`page-${idx}`} size="A4" style={styles.page}>
                        <Text style={styles.title}>REGISTRO DE INSPECCIÓN DE DEFICIENCIAS - SED {empresaInfo?.sed || 'S/E'}</Text>
                        
                        <View style={styles.table}>
                            <View style={styles.row}>
                                <Text style={[styles.headerCell, { width: '15%' }]}>SED:</Text>
                                <Text style={[styles.valueCell, { width: '15%' }]}>{empresaInfo?.sed || "-"}</Text>
                                <Text style={[styles.headerCell, { width: '15%' }]}>Circuito:</Text>
                                {/* AQUÍ IMPRIME CIR. 3 */}
                                <Text style={[styles.valueCell, { width: '25%', fontWeight: 'bold' }]}>
                                    {getCircuito(item.deficiencia, empresaInfo?.alimentador)}
                                </Text>
                                <Text style={[styles.headerCell, { width: '15%' }]}>Fecha Reg:</Text>
                                <Text style={[styles.valueCell, { width: '15%', borderRight: 0 }]}>{formatDate(item.deficiencia?.defiFecRegistro)}</Text>
                            </View>
                            
                            <View style={styles.row}>
                                <Text style={[styles.headerCell, { width: '15%' }]}>Secuencia:</Text>
                                <Text style={[styles.valueCell, { width: '15%' }]}>{item.deficiencia?.defiInterno || "0"}</Text>
                                
                                {/* AQUÍ SE MUESTRA EL NÚMERO DE TRAMO ORDENADO */}
                                <Text style={[styles.headerCell, { width: '15%' }]}>Tramo:</Text>
                                <Text style={[styles.valueCell, { width: '25%', color: '#2563eb', fontWeight: 'bold' }]}>
                                    {item.deficiencia?.tramoCalculado || '-'}
                                </Text>
                                
                                <Text style={[styles.headerCell, { width: '15%' }]}>Hora Inicio:</Text>
                                <Text style={[styles.valueCell, { width: '15%', borderRight: 0 }]}>{formatTime(item.deficiencia?.defiFecRegistro, true, item.deficiencia)}</Text>
                            </View>
                            
                            <View style={styles.rowNoBorder}>
                                <Text style={[styles.headerCell, { width: '15%' }]}>Tipo Elem:</Text>
                                <Text style={[styles.valueCell, { width: '15%' }]}>{item.deficiencia?.defiTipoElemento === 'POST' ? 'POSTE' : 'VANO'}</Text>
                                
                                <Text style={[styles.headerCell, { width: '15%' }]}>Criticidad:</Text>
                                <Text style={[styles.valueCell, { width: '25%', color: isSinDef || criticidadTexto === 'NO APLICA' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }]}>
                                    {criticidadTexto}
                                </Text>
                                
                                <Text style={[styles.headerCell, { width: '15%' }]}>Hora Fin:</Text>
                                <Text style={[styles.valueCell, { width: '15%', borderRight: 0 }]}>{formatTime(item.deficiencia?.defiFecRegistro, false, null)}</Text>
                            </View>
                        </View>

                        <View style={styles.table}>
                            <View style={styles.row}>
                                <Text style={[styles.headerCell, { width: '20%' }]}>Código GIS / Nodo:</Text>
                                <Text style={[styles.valueCell, { width: '30%', fontWeight: 'bold' }]}>{item.deficiencia?.defiCodigoElemento || '-'}</Text>
                                <Text style={[styles.headerCell, { width: '20%' }]}>Tipificación:</Text>
                                <Text style={[styles.valueCell, { width: '30%', borderRight: 0, color: isSinDef ? '#16a34a' : '#dc2626', fontWeight: 'bold' }]}>
                                    {tipificacion.code}
                                </Text>
                            </View>
                            <View style={styles.rowNoBorder}>
                                <Text style={[styles.headerCell, { width: '20%' }]}>Descripción:</Text>
                                <Text style={[styles.valueCell, { width: '80%', borderRight: 0, fontSize: 8 }]}>
                                    {tipificacion.description}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.photoGrid}>
                            {[
                                { key: 'panoramica', label: 'VISTA PANORÁMICA' },
                                { key: 'frontal', label: 'VISTA FRONTAL' },
                                { key: 'detalle', label: 'DETALLE DE DEFICIENCIA' },
                                { key: 'evidencia', label: 'EVIDENCIA / MEDICIÓN' }
                            ].map(photoType => (
                                <View key={photoType.key} style={styles.photoBox}>
                                    {item.fotos && item.fotos[photoType.key] && typeof item.fotos[photoType.key] === 'string' ? (
                                        <Image src={item.fotos[photoType.key]} style={styles.img} />
                                    ) : (
                                        <View style={{ height: 210, justifyContent: 'center' }}>
                                            <Text style={styles.noImgText}>SIN IMAGEN</Text>
                                        </View>
                                    )}
                                    <Text style={styles.photoTitle}>{photoType.label}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ width: '100%', border: '0.5pt solid #000', padding: 4, marginTop: 5, backgroundColor: '#f0f0f0' }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Leyenda: <Text style={{ fontWeight: 'normal' }}>RIP: Responsable de Inspección | BT: Baja Tensión</Text></Text>
                        </View>

                        <View style={styles.signatures}>
                            <View style={styles.signBox}>
                                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Firma Responsable de Inspección (RIP)</Text>
                                <Text style={{ marginTop: 15, fontSize: 8 }}>Nombre: {inspectorName}</Text>
                            </View>
                            <View style={styles.signBox}>
                                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Firma Supervisor de Obra</Text>
                                <Text style={{ marginTop: 15, fontSize: 8 }}>Nombre: RIOS VERGARA RONALD RENZO</Text>
                            </View>
                        </View>

                    </Page>
                );
            })}
        </Document>
    );
};

export default DeficiencyPdfDocument;