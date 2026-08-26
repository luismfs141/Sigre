import React, { useRef, useState } from "react";

import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";

import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

import { useFeeder } from "../../hooks/useFeeder";
import { useGapsBySed } from "../../hooks/useGap";

const AgregarTramos = () => {
  const toast = useRef(null);

  const { feeders, loading: loadingFeeders } = useFeeder();

  const { agregarTramosAlReporte, loadingTramos } = useGapsBySed();

  const [selectedFeeder, setSelectedFeeder] = useState(null);
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (extension !== "xlsx") {
      toast.current?.show({
        severity: "warn",
        summary: "Archivo inválido",
        detail: "Debe seleccionar un archivo Excel (.xlsx).",
        life: 4000,
      });

      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleAgregarTramos = async () => {
    if (!selectedFeeder) {
      toast.current?.show({
        severity: "warn",
        summary: "Alimentador requerido",
        detail: "Debe seleccionar un alimentador.",
        life: 4000,
      });

      return;
    }

    if (!file) {
      toast.current?.show({
        severity: "warn",
        summary: "Archivo requerido",
        detail: "Debe cargar un archivo Excel.",
        life: 4000,
      });

      return;
    }

    console.log(selectedFeeder);

    const resultado = await agregarTramosAlReporte(file, selectedFeeder);

    if (resultado) {
      toast.current?.show({
        severity: "success",
        summary: "Proceso completado",
        detail: "Los tramos fueron agregados correctamente al reporte.",
        life: 5000,
      });

      setFile(null);

      const input = document.getElementById("excel-tramos-input");

      if (input) {
        input.value = "";
      }
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo procesar el archivo Excel.",
        life: 5000,
      });
    }
  };

  const eliminarArchivo = () => {
    setFile(null);

    const input = document.getElementById("excel-tramos-input");

    if (input) {
      input.value = "";
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* ENCABEZADO */}
      <div className="flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="m-0 flex align-items-center gap-2">
            <FileSpreadsheet size={28} />
            Agregar Tramos
          </h2>

          <p className="text-500 mt-2 mb-0">
            Seleccione un alimentador y cargue el reporte Excel para agregar los
            códigos de tramo.
          </p>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="surface-card border-round shadow-2 p-4">
        {/* ALIMENTADOR */}
        <div className="field mb-4">
          <label htmlFor="feeder" className="font-semibold block mb-2">
            Alimentador
          </label>

          <Dropdown
            id="feeder"
            value={selectedFeeder}
            options={feeders}
            onChange={(e) => setSelectedFeeder(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccione un alimentador"
            loading={loadingFeeders}
            filter
            showClear
            className="w-full"
          />
        </div>

        {/* ARCHIVO */}
        <div className="field mb-4">
          <label className="font-semibold block mb-2">Archivo Excel</label>

          <div
            className="border-2 border-dashed border-300 border-round p-4 text-center"
            style={{
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onClick={() =>
              document.getElementById("excel-tramos-input")?.click()
            }
          >
            <input
              id="excel-tramos-input"
              type="file"
              accept=".xlsx"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {!file ? (
              <div className="flex flex-column align-items-center gap-3">
                <Upload size={40} />

                <div>
                  <div className="font-semibold mb-1">
                    Seleccionar archivo Excel
                  </div>

                  <span className="text-500 text-sm">
                    Formato permitido: .xlsx
                  </span>
                </div>

                <Button
                  type="button"
                  label="Seleccionar archivo"
                  icon={<Upload size={16} />}
                  outlined
                  onClick={(e) => {
                    e.stopPropagation();

                    document.getElementById("excel-tramos-input")?.click();
                  }}
                />
              </div>
            ) : (
              <div className="flex align-items-center justify-content-between">
                <div className="flex align-items-center gap-3">
                  <FileSpreadsheet size={36} />

                  <div className="text-left">
                    <div className="font-semibold">{file.name}</div>

                    <div className="text-500 text-sm">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  icon={<X size={18} />}
                  severity="danger"
                  text
                  rounded
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarArchivo();
                  }}
                  tooltip="Eliminar archivo"
                />
              </div>
            )}
          </div>
        </div>

        {/* PROGRESO */}
        {loadingTramos && (
          <div className="mb-4">
            <div className="flex align-items-center gap-2 mb-2">
              <span className="text-500">Procesando reporte...</span>
            </div>

            <ProgressBar mode="indeterminate" />
          </div>
        )}

        {/* BOTÓN */}
        <div className="flex justify-content-end mt-4">
          <Button
            label={loadingTramos ? "Agregando tramos..." : "Agregar Tramos"}
            icon={loadingTramos ? undefined : <CheckCircle size={18} />}
            loading={loadingTramos}
            disabled={!selectedFeeder || !file || loadingTramos}
            onClick={handleAgregarTramos}
          />
        </div>
      </div>
    </div>
  );
};

export default AgregarTramos;
