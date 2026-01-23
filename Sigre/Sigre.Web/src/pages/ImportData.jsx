import { useState } from "react";
import { useOffline } from "../hooks/useOffline";

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState(null);

  const { deficiencias, loading, error, loadFromSqliteFile } = useOffline();

  /* ===============================
     CARGA ARCHIVO SQLITE
     =============================== */
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".db")) {
      setLocalError("Solo se permiten archivos .db de SQLite");
      setFile(null);
      return;
    }

    setLocalError(null);
    setFile(selectedFile);

    await loadFromSqliteFile(selectedFile);
  };

  return (
    <div style={styles.page}>
      {/* CABECERA */}
      <div style={styles.header}>
        <h2 style={styles.title}>Importar datos</h2>

        <div style={styles.headerActions}>
          <input type="file" accept=".db" onChange={handleFileChange} />
        </div>
      </div>

      {/* CUERPO */}
      <div style={styles.bodyWrapper}>
        <div style={styles.body}>
          {localError && <p style={styles.error}>{localError}</p>}
          {error && <p style={styles.error}>{error}</p>}

          <table style={styles.table}>
            <thead>
              <tr>
                <th>DefiInterno</th>
                <th>Estado</th>
                <th>Código</th>
                <th>Latitud</th>
                <th>Longitud</th>
                <th>Tipo</th>
                <th>Elemento</th>
                <th>Fecha</th>
                <th>Activo</th>
                <th>Criticidad</th>
                <th>Inspeccionado</th>
                <th>ServerId</th>
                <th>EstadoOffline</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr>
                <td colSpan={12} style={styles.empty}>
                    Cargando datos...
                </td>
                </tr>
            ) : deficiencias.filter(d => d.estadoOffLine !== null && d.estadoOffLine !== 0).length === 0 ? (
                <tr>
                <td colSpan={12} style={styles.empty}>
                    No hay registros para mostrar
                </td>
                </tr>
            ) : (
                deficiencias
                .filter(d => d.estadoOffLine !== null && d.estadoOffLine !== 0) 
                .map((row) => (
                    <tr key={row.defiInterno}>
                    <td>{row.defiInterno}</td>
                    <td>{row.defiEstado}</td>
                    <td>{row.defiCodigoElemento}</td>
                    <td>{row.defiLatitud}</td>
                    <td>{row.defiLongitud}</td>
                    <td>{row.defiTipoElemento}</td>
                    <td>{row.defiIdElemento}</td>
                    <td>{row.defiFecRegistro}</td>
                    <td>{row.defiActivo?.toString()}</td>
                    <td>{row.defiEstadoCriticidad}</td>
                    <td>{row.defiInspeccionado.toString()}</td>
                    <td>{row.defiServerId}</td>
                    <td>{row.estadoOffLine}</td>
                    </tr>
                ))
            )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "16px", height: "100vh", boxSizing: "border-box" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px"
  },
  title: { fontSize: "22px", fontWeight: 600 },
  headerActions: { display: "flex", gap: "12px", alignItems: "center" },
  bodyWrapper: {
    width: "100%",
    height: "calc(100vh - 110px)",
    overflow: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "8px"
  },
  body: { minWidth: "1400px", background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  error: { color: "red", margin: "8px" },
  empty: { textAlign: "center", padding: "16px", color: "#666" }
};
