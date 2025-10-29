import React from 'react';

const ModalEmpresa = ({
  visible,
  onClose,
  onChange,
  onSave,
  dataEmpresa,
}) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h5 className="text-start">Registrar Nuevo Empresa</h5>
        <form>
          <div className="mb-2">
            <label className="form-label">RUC</label>
            <input
              type="text"
              className="form-control"
              name="dni"
              value={dataEmpresa.ruc}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-control"
              name="nombre"
              value={dataEmpresa.nombre}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Teléfono</label>
            <input
              type="text"
              className="form-control"
              name="telefono"
              value={dataEmpresa.telefono}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Correo</label>
            <input
              type="text"
              className="form-control"
              name="correo"
              value={dataEmpresa.correo}
              onChange={onChange}
            />
          </div>
          <div className="mt-3 d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEmpresa;