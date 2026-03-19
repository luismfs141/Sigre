import { useState } from "react";
import { useOffline } from "../hooks/useOffline";

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState(null);
  const {
    deficiencias,
    archivos,
    loading,
    syncing,
    error,
    loadFromSqliteFile,
    syncData
  } = useOffline();

  const hasOfflineData =
    deficiencias.some(d => d.estadoOffLine > 0) ||
    archivos.some(a => a.estadoOffLine > 0);

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

  // const handleSync = async () => {
  //   if (!file) {
  //     setLocalError("Seleccione un archivo SQLite");
  //     return;
  //   }

  //   if (!hasOfflineData) {
  //     setLocalError("No existen datos offline para sincronizar");
  //     return;
  //   }

  //   if (!window.confirm("¿Desea sincronizar los datos offline?")) return;

  //   try {
  //     const result = await syncData(file);

  //     alert(`✔ Sincronización completa
  // Deficiencias sincronizadas: ${result.deficienciasSincronizadas}
  // Archivos sincronizados: ${result.archivosSincronizados}`);

  //   } catch {
  //     // error manejado en el hook
  //   }
  // };

  const handleSync = async () => {
    if (!file) {
      setLocalError("Seleccione un archivo SQLite");
      return;
    }

    if (!hasOfflineData) {
      setLocalError("No existen datos offline para sincronizar");
      return;
    }

    if (!window.confirm("¿Desea sincronizar los datos offline?")) return;

    try {
      const result = await syncData(file);

      alert(`✔ Sincronización completa

      Deficiencias:
        Insertadas: ${result.deficiencias.insertadas}
        Modificadas: ${result.deficiencias.modificadas}
        Total: ${result.deficiencias.total}

      Archivos:
        Insertados: ${result.archivos.insertados}
        Modificados: ${result.archivos.modificados}
        Total: ${result.archivos.total}
          `);

    } catch {
      // error manejado en el hook
    }
  };

  return (
    <div style={styles.page}>
      {/* CABECERA */}
      <div style={styles.header}>
        <h2 style={styles.title}>Importar datos</h2>

        <div style={styles.headerActions}>
          <button
            onClick={handleSync}
            disabled={!file || !hasOfflineData || syncing}
            style={{
                      padding: "8px 16px",
                      background: syncing ? "#9ca3af" : "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: syncing ? "not-allowed" : "pointer"
                    }}
          >
            {syncing ? "Sincronizando..." : "Sincronizar datos"}
          </button>
          <input
  type="file"
  accept=".db"
  onClick={(e) => {
    e.target.value = null;
  }}
  onChange={handleFileChange}
/>
        </div>
      </div>

      {/* CUERPO DIVIDIDO */}
      <div style={styles.bodyWrapper}>
        {/* Tabla Deficiencias */}
        <div style={styles.tableContainer}>
          <h3>Deficiencias</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>DefiInterno</th>
                <th>Estado</th>
                <th>Código</th>
                <th>Tipificación</th>
                <th>Tipo</th>
                <th>Elemento</th>
                <th>Fecha</th>
                <th>Activo</th>
                <th>Criticidad</th>
                <th>EstadoOffline</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={styles.empty}>
                    Cargando datos...
                  </td>
                </tr>
              ) : deficiencias.filter(d => d.estadoOffLine !== null && d.estadoOffLine !== 0).length === 0 ? (
                <tr>
                  <td colSpan={13} style={styles.empty}>
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
                      <td>{row.tipiInterno}</td>
                      <td>{row.defiTipoElemento}</td>
                      <td>{row.defiIdElemento}</td>
                      <td>{row.defiFecRegistro}</td>
                      <td>{row.defiActivo?.toString()}</td>
                      <td>{row.defiEstadoCriticidad}</td>
                      <td>{row.estadoOffLine}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tabla Archivos */}
        <div style={styles.tableContainer}>
          <h3>Archivos</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ArchInterno</th>
                <th>ArchNombre</th>
                <th>ArchTipo</th>
                <th>ArchTabla</th>
                <th>ArchCodTabla</th>
                <th>Fecha</th>
                <th>Elemento</th>
                <th>TipiInterno</th>
                <th>Activo</th>
                <th>EstadoOffline</th>
                <th>DefiServerId</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={styles.empty}>
                    Cargando datos...
                  </td>
                </tr>
              ) : archivos.length === 0 ? (
                <tr>
                  <td colSpan={13} style={styles.empty}>
                    No hay archivos para mostrar
                  </td>
                </tr>
              ) : (
                archivos
                .filter(d => d.estadoOffLine !== null && d.estadoOffLine !== 0)
                .map((row) => (
                  <tr key={row.archInterno}>
                    <td>{row.archInterno}</td>
                    <td>{row.archNombre}</td>
                    <td>{row.archTipo}</td>
                    <td>{row.archTabla}</td>
                    <td>{row.archCodTabla}</td>
                    <td>{row.archFecha}</td>
                    <td>{row.archIdElemento}</td>
                    <td>{row.tipiInterno}</td>
                    <td>{row.archActivo?.toString()}</td>
                    <td>{row.estadoOffLine}</td>
                    <td>{row.defiServerId}</td>
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
    display: "flex",
    width: "100%",
    height: "calc(100vh - 110px)",
    overflow: "auto",
    gap: "12px"
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "8px",
    minWidth: "0" // permite que flex-shrink funcione
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  error: { color: "red", margin: "8px" },
  empty: { textAlign: "center", padding: "16px", color: "#666" },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "8px"
  }
};
