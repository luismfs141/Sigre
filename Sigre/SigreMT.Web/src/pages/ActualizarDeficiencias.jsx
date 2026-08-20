import React, { useMemo, useRef, useState } from "react";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ProgressBar } from "primereact/progressbar";

import {
  Upload,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  Ban,
  CheckCircle,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  X,
} from "lucide-react";

import { useFeeder } from "../hooks/useFeeder";

/* =========================================================================
   ESTILOS
=========================================================================== */

const customStyles = `
    .upload-zone {
        border: 2px dashed #cbd5e1;
        transition: all 0.2s ease;
    }

    .upload-zone:hover {
        border-color: #3b82f6;
        background-color: #eff6ff;
    }

    .upload-zone.has-file {
        border-color: #22c55e;
        background-color: #f0fdf4;
    }

    .stat-card {
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .filtro-elemento .p-inputtext {
        width: 100%;
    }

    .p-datatable .p-datatable-thead > tr > th {
        white-space: nowrap;
    }

    .p-datatable .p-datatable-tbody > tr > td {
        white-space: nowrap;
    }
`;

/* =========================================================================
   ESTADO INICIAL
=========================================================================== */

const initialResultado = {
  elementosExcel: 0,
  elementosEncontrados: 0,
  elementosNuevos: 0,

  deficienciasExcel: 0,
  deficienciasActualizadas: 0,
  deficienciasNuevas: 0,
  deficienciasDesactivadas: 0,
  deficienciasSinCambios: 0,

  errores: 0,

  detalle: [],
};

/* =========================================================================
   COMPONENTE
=========================================================================== */

export default function ActualizarDeficiencias() {
  /* ---------------------------------------------------------------------
       ESTADOS
    --------------------------------------------------------------------- */

  const [selectedFeeder, setSelectedFeeder] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [elementFilter, setElementFilter] = useState("");

  const [resultado, setResultado] = useState(initialResultado);

  const [isUploading, setIsUploading] = useState(false);

  const [progreso, setProgreso] = useState(0);

  /* ---------------------------------------------------------------------
       HOOKS
    --------------------------------------------------------------------- */

  const { feeders } = useFeeder();

  const toast = useRef(null);

  const fileInputRef = useRef(null);

  /* ---------------------------------------------------------------------
       ALIMENTADOR SELECCIONADO
    --------------------------------------------------------------------- */

  const feederId = useMemo(() => {
    if (!selectedFeeder) {
      return null;
    }

    return (
      selectedFeeder?.value ||
      selectedFeeder?.feederInterno ||
      selectedFeeder?.alimInterno ||
      selectedFeeder?.id ||
      selectedFeeder
    );
  }, [selectedFeeder]);

  /* ---------------------------------------------------------------------
       ELEMENTOS FILTRADOS
    --------------------------------------------------------------------- */

  const elementosFiltrados = useMemo(() => {
    if (!elementFilter.trim()) {
      return resultado.detalle || [];
    }

    const texto = elementFilter.toLowerCase().trim();

    return (resultado.detalle || []).filter((item) => {
      return (
        String(item.codigo || "")
          .toLowerCase()
          .includes(texto) ||
        String(item.etiqueta || "")
          .toLowerCase()
          .includes(texto) ||
        String(item.tipoElemento || "")
          .toLowerCase()
          .includes(texto) ||
        String(item.sedCodigo || "")
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [resultado.detalle, elementFilter]);

  /* =========================================================================
       SELECCIONAR ARCHIVO
    ======================================================================== */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      toast.current?.show({
        severity: "warn",
        summary: "Archivo inválido",
        detail: "Debe seleccionar un archivo Excel (.xlsx o .xls)",
        life: 4000,
      });

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    // Limpiamos resultados anteriores
    setResultado(initialResultado);

    setElementFilter("");
  };

  /* =========================================================================
       QUITAR ARCHIVO
    ======================================================================== */

  const handleRemoveFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setResultado(initialResultado);

    setElementFilter("");
  };

  /* =========================================================================
       ABRIR SELECTOR DE ARCHIVO
    ======================================================================== */

  const handleSelectFile = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  /* =========================================================================
       ACTUALIZAR DESDE EXCEL
    ======================================================================== */

  const handleActualizarExcel = async () => {
    if (!feederId) {
      toast.current?.show({
        severity: "warn",
        summary: "Alimentador requerido",
        detail: "Seleccione un alimentador antes de continuar.",
        life: 4000,
      });

      return;
    }

    if (!selectedFile) {
      toast.current?.show({
        severity: "warn",
        summary: "Archivo requerido",
        detail: "Seleccione un archivo Excel antes de continuar.",
        life: 4000,
      });

      return;
    }

    setIsUploading(true);
    setProgreso(10);

    try {
      /*
       * ================================================================
       * PREPARAR ARCHIVO
       * ================================================================
       */

      const formData = new FormData();

      formData.append("archivo", selectedFile);

      formData.append("alimentadorId", feederId);

      /*
       * ================================================================
       * AQUÍ CONECTAREMOS EL ENDPOINT REAL
       *
       * Ejemplo:
       *
       * const response = await api.post(
       *     '/deficiencias/actualizar-excel',
       *     formData,
       *     {
       *         headers: {
       *             'Content-Type': 'multipart/form-data'
       *         }
       *     }
       * );
       *
       * const data = response.data;
       *
       * ================================================================
       */

      setProgreso(30);

      /*
       * ----------------------------------------------------------------
       * TEMPORAL
       *
       * Esta parte simula la respuesta del backend.
       *
       * Posteriormente se elimina y se reemplaza por la llamada real.
       * ----------------------------------------------------------------
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      setProgreso(60);

      await new Promise((resolve) => setTimeout(resolve, 700));

      const data = {
        elementosExcel: 0,
        elementosEncontrados: 0,
        elementosNuevos: 0,

        deficienciasExcel: 0,
        deficienciasActualizadas: 0,
        deficienciasNuevas: 0,
        deficienciasDesactivadas: 0,
        deficienciasSinCambios: 0,

        errores: 0,

        detalle: [],
      };

      setProgreso(100);

      setResultado(data);

      toast.current?.show({
        severity: "success",
        summary: "Actualización completada",
        detail: "El archivo fue procesado correctamente.",
        life: 5000,
      });
    } catch (error) {
      console.error("Error actualizando deficiencias:", error);

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo procesar el archivo.",
        life: 5000,
      });
    } finally {
      setIsUploading(false);

      setTimeout(() => {
        setProgreso(0);
      }, 1000);
    }
  };

  /* =========================================================================
       ESTADOS
    ======================================================================== */

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoActualizacion;

    switch (estado) {
      case "NUEVO":
        return <Tag value="NUEVO" severity="warning" />;

      case "ACTUALIZADO":
        return <Tag value="ACTUALIZADO" severity="success" />;

      case "SIN_CAMBIOS":
        return <Tag value="SIN CAMBIOS" severity="info" />;

      case "DESACTIVADO":
        return <Tag value="DESACTIVADO" severity="danger" />;

      case "ERROR":
        return <Tag value="ERROR" severity="danger" />;

      default:
        return <Tag value="PENDIENTE" severity="secondary" />;
    }
  };

  /* =========================================================================
       TIPO ELEMENTO
    ======================================================================== */

  const tipoElementoTemplate = (rowData) => {
    const tipo = rowData.tipoElemento || rowData.tipo || "-";

    return <span className="font-semibold">{tipo}</span>;
  };

  /* =========================================================================
       DEFICIENCIAS
    ======================================================================== */

  const deficienciasTemplate = (rowData) => {
    const cantidad = rowData.cantidadDeficiencias ?? 0;

    return (
      <Tag value={cantidad} severity={cantidad > 0 ? "warning" : "secondary"} />
    );
  };

  /* =========================================================================
       FILA / ERROR
    ======================================================================== */

  const detalleTemplate = (rowData) => {
    if (!rowData.mensaje) {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <span
        className={
          rowData.estadoActualizacion === "ERROR"
            ? "text-red-600"
            : "text-gray-600"
        }
        title={rowData.mensaje}
      >
        {rowData.mensaje}
      </span>
    );
  };

  /* =========================================================================
       CONTADORES
    ======================================================================== */

  const estadisticas = [
    {
      label: "Elementos",
      value: resultado.elementosExcel,
      icon: FileText,
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },

    {
      label: "Deficiencias",
      value: resultado.deficienciasExcel,
      icon: ClipboardCheck,
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },

    {
      label: "Nuevas",
      value: resultado.deficienciasNuevas,
      icon: Plus,
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },

    {
      label: "Actualizadas",
      value: resultado.deficienciasActualizadas,
      icon: RefreshCw,
      className: "bg-green-50 text-green-700 border-green-200",
    },

    {
      label: "Desactivadas",
      value: resultado.deficienciasDesactivadas,
      icon: Ban,
      className: "bg-red-50 text-red-700 border-red-200",
    },

    {
      label: "Sin cambios",
      value: resultado.deficienciasSinCambios,
      icon: CheckCircle,
      className: "bg-gray-50 text-gray-700 border-gray-200",
    },

    {
      label: "Errores",
      value: resultado.errores,
      icon: AlertTriangle,
      className: "bg-red-50 text-red-700 border-red-200",
    },
  ];

  /* =========================================================================
       RENDER
    ======================================================================== */

  return (
    <div className="p-4 bg-white rounded-lg shadow-md w-full flex flex-col h-full overflow-hidden">
      <style>{customStyles}</style>

      <Toast ref={toast} />

      {/* =================================================================
                CABECERA
            ================================================================== */}

      <div className="flex-none mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Actualización de Elementos y Deficiencias
            </h2>

            <p className="text-sm text-gray-500">
              Sincronización de información mediante archivo Excel
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================
                FILTROS / ARCHIVO
            ================================================================== */}

      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex-none">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          {/* ---------------------------------------------------------
                        ALIMENTADOR
                    ---------------------------------------------------------- */}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">
              ALIMENTADOR
            </label>

            <Dropdown
              value={selectedFeeder}
              onChange={(e) => {
                setSelectedFeeder(e.value);

                setSelectedFile(null);

                setResultado(initialResultado);

                setElementFilter("");

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              options={feeders}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione alimentador..."
              filter
              disabled={isUploading}
              className="w-full p-inputtext-sm shadow-sm"
            />
          </div>

          {/* ---------------------------------------------------------
                        ARCHIVO
                    ---------------------------------------------------------- */}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">
              ARCHIVO EXCEL
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={handleSelectFile}
                disabled={isUploading}
                className="
                                    upload-zone
                                    w-full
                                    h-[42px]
                                    rounded-md
                                    bg-white
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    text-sm
                                    text-gray-600
                                    hover:text-blue-600
                                "
              >
                <FileSpreadsheet className="w-5 h-5" />

                <span>Seleccionar archivo Excel</span>
              </button>
            ) : (
              <div
                className="
                                    upload-zone
                                    has-file
                                    h-[42px]
                                    rounded-md
                                    px-3
                                    flex
                                    items-center
                                    justify-between
                                    gap-2
                                "
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />

                  <span
                    className="text-sm font-medium text-gray-700 truncate"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------
                        BOTÓN
                    ---------------------------------------------------------- */}

          <div>
            <Button
              label={
                isUploading ? "Procesando Excel..." : "Actualizar desde Excel"
              }
              icon={isUploading ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
              onClick={handleActualizarExcel}
              disabled={isUploading || !selectedFeeder || !selectedFile}
              className="w-full font-bold shadow-sm"
              severity="primary"
            />
          </div>
        </div>

        {/* -------------------------------------------------------------
                    PROGRESO
                -------------------------------------------------------------- */}

        {isUploading && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">
                Procesando información...
              </span>

              <span className="text-xs font-semibold text-gray-600">
                {progreso}%
              </span>
            </div>

            <ProgressBar
              value={progreso}
              showValue={false}
              style={{ height: "6px" }}
            />
          </div>
        )}
      </div>

      {/* =================================================================
                CONTADORES
            ================================================================== */}

      <div
        className="
                    grid
                    grid-cols-2
                    md:grid-cols-4
                    lg:grid-cols-7
                    gap-3
                    mb-4
                    flex-none
                "
      >
        {estadisticas.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`
                                stat-card
                                border
                                rounded-lg
                                p-3
                                ${item.className}
                            `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                    {item.label}
                  </p>

                  <p className="text-xl font-bold mt-1">
                    {item.value.toLocaleString("es-PE")}
                  </p>
                </div>

                <Icon className="w-6 h-6 opacity-60" />
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================================
                FILTRO ELEMENTO
            ================================================================== */}

      <div className="mb-3 flex-none">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search
            className="
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            w-4
                            h-4
                            text-gray-400
                        "
          />

          <InputText
            value={elementFilter}
            onChange={(e) => setElementFilter(e.target.value)}
            placeholder="Filtrar por código, etiqueta, SED o tipo..."
            className="w-full pl-9 p-inputtext-sm"
          />
        </div>
      </div>

      {/* =================================================================
                TABLA
            ================================================================== */}

      <div
        className="
                    border
                    rounded-lg
                    overflow-hidden
                    flex-grow
                    flex
                    flex-col
                    min-h-0
                "
      >
        <DataTable
          value={elementosFiltrados}
          loading={isUploading}
          scrollable
          scrollHeight="flex"
          size="small"
          stripedRows
          showGridlines
          paginator
          rows={30}
          rowsPerPageOptions={[15, 30, 50, 100]}
          emptyMessage={
            selectedFile
              ? "No hay resultados para mostrar."
              : "Seleccione un alimentador y cargue un archivo Excel."
          }
          className="text-sm h-full"
        >
          {/* ---------------------------------------------------------
                        CÓDIGO
                    ---------------------------------------------------------- */}

          <Column
            field="codigo"
            header="Código"
            sortable
            frozen
            alignFrozen="left"
            style={{
              minWidth: "140px",
              fontWeight: "bold",
            }}
          />

          {/* ---------------------------------------------------------
                        TIPO
                    ---------------------------------------------------------- */}

          <Column
            field="tipoElemento"
            header="Tipo"
            body={tipoElementoTemplate}
            sortable
            style={{
              minWidth: "100px",
            }}
          />

          {/* ---------------------------------------------------------
                        SED
                    ---------------------------------------------------------- */}

          <Column
            field="sedCodigo"
            header="SED"
            sortable
            style={{
              minWidth: "120px",
            }}
          />

          {/* ---------------------------------------------------------
                        ETIQUETA
                    ---------------------------------------------------------- */}

          <Column
            field="etiqueta"
            header="Etiqueta"
            sortable
            style={{
              minWidth: "140px",
            }}
          />

          {/* ---------------------------------------------------------
                        DEFICIENCIAS
                    ---------------------------------------------------------- */}

          <Column
            field="cantidadDeficiencias"
            header="Deficiencias"
            body={deficienciasTemplate}
            sortable
            align="center"
            style={{
              minWidth: "110px",
            }}
          />

          {/* ---------------------------------------------------------
                        ESTADO
                    ---------------------------------------------------------- */}

          <Column
            field="estadoActualizacion"
            header="Estado actualización"
            body={estadoTemplate}
            sortable
            style={{
              minWidth: "160px",
            }}
          />

          {/* ---------------------------------------------------------
                        DETALLE
                    ---------------------------------------------------------- */}

          <Column
            field="mensaje"
            header="Detalle"
            body={detalleTemplate}
            style={{
              minWidth: "250px",
              maxWidth: "350px",
            }}
          />
        </DataTable>
      </div>
    </div>
  );
}
