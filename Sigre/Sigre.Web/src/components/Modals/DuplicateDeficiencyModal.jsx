import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

export default function CloneDeficiencyModal({
    visible,
    deficiencyId,
    getDeficiencyById,
    onHide,
    onSave,
    tipificaciones = []
}) {

    const [deficiency, setDeficiency] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        const loadDeficiency = async () => {

            if (!deficiencyId) return;

            setLoading(true);

            const data = await getDeficiencyById(deficiencyId);

            if (data) {

                setDeficiency({
                    ...data,

                    defiInterno: 0,
                    defiObservacion: "",
                    defiComentario: "",
                    tipiInterno: null,

                    defiFechaDenuncia: null,
                    defiFechaInspeccion: null
                });

            }

            setLoading(false);
        };

        if (visible) loadDeficiency();

    }, [visible, deficiencyId]);


    const updateField = (field, value) => {
        setDeficiency(prev => ({
            ...prev,
            [field]: value
        }));
    };


    const footer = (
        <div className="flex justify-end gap-2">

            <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-text"
                onClick={onHide}
            />

            <Button
                label="Guardar"
                icon="pi pi-save"
                onClick={() => onSave(deficiency)}
                disabled={!deficiency}
            />

        </div>
    );


    return (
        <Dialog
            header={`Deficiencia #${deficiencyId}`}
            visible={visible}
            style={{ width: "750px" }}
            footer={footer}
            onHide={onHide}
        >

            {loading && <p>Cargando datos...</p>}

            {!loading && deficiency && (

                <div className="p-fluid">

                    {/* FILA 1 */}
                    <div className="grid mb-3">

                        <div className="col-3">
                            <label className="font-semibold">Tipo Elemento</label>
                            <InputText
                                value={deficiency.tipoElemento || ""}
                                readOnly
                            />
                        </div>

                        <div className="col-3">
                            <label className="font-semibold">Código Elemento</label>
                            <InputText
                                value={deficiency.elementoCodigo || ""}
                                readOnly
                            />
                        </div>

                        <div className="col-3">
                            <label className="font-semibold">Longitud</label>
                            <InputText
                                value={deficiency.longitud || ""}
                                readOnly
                            />
                        </div>

                        <div className="col-3">
                            <label className="font-semibold">Latitud</label>
                            <InputText
                                value={deficiency.latitud || ""}
                                readOnly
                            />
                        </div>

                    </div>


                    {/* FILA 2 */}
                    <div className="grid mb-3">

                        <div className="col-6">
                            <label className="font-semibold">Tipificación</label>
                            <Dropdown
                                value={deficiency.tipiInterno}
                                options={tipificaciones}
                                optionLabel="tipiDescripcion"
                                optionValue="tipiInterno"
                                placeholder="Seleccione tipificación"
                                onChange={(e) =>
                                    updateField("tipiInterno", e.value)
                                }
                            />
                        </div>

                        <div className="col-6">
                            <label className="font-semibold">Observación</label>
                            <InputText
                                value={deficiency.defiObservacion || ""}
                                onChange={(e) =>
                                    updateField("defiObservacion", e.target.value)
                                }
                            />
                        </div>

                    </div>


                    {/* FILA 3 */}
                    <div className="grid mb-3">
                        <div className="col-12">
                            <label className="font-semibold">Comentario</label>
                            <InputTextarea
                                rows={3}
                                autoResize
                                value={deficiency.defiComentario || ""}
                                onChange={(e) =>
                                    updateField("defiComentario", e.target.value)
                                }
                            />
                        </div>
                    </div>


                    {/* FILA 4 */}
                    <div className="grid">

                        <div className="col-6">
                            <label className="font-semibold">Fecha Denuncia</label>
                            <Calendar
                                value={deficiency.defiFechaDenuncia}
                                onChange={(e) =>
                                    updateField("defiFechaDenuncia", e.value)
                                }
                                dateFormat="dd/mm/yy"
                                showIcon
                            />
                        </div>

                        <div className="col-6">
                            <label className="font-semibold">Fecha Inspección</label>
                            <Calendar
                                value={deficiency.defiFechaInspeccion}
                                onChange={(e) =>
                                    updateField("defiFechaInspeccion", e.value)
                                }
                                dateFormat="dd/mm/yy"
                                showIcon
                            />
                        </div>

                    </div>

                </div>

            )}

        </Dialog>
    );
}