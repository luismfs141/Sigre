import React from 'react';

const ModalPersonalNuevo = ({
  visible,
  onClose,
  onChange,
  onSave,
  nuevoPersonal,
}) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h5 className="text-start">Registrar Nuevo Personal</h5>
        <form>
          <div className="mb-2">
            <label className="form-label">DNI</label>
            <input
              type="text"
              className="form-control"
              name="dni"
              value={nuevoPersonal.dni}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Nombres</label>
            <input
              type="text"
              className="form-control"
              name="nombres"
              value={nuevoPersonal.nombres}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Apellidos</label>
            <input
              type="text"
              className="form-control"
              name="apellidos"
              value={nuevoPersonal.apellidos}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Área</label>
            <input
              type="text"
              className="form-control"
              name="area"
              value={nuevoPersonal.area}
              onChange={onChange}
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Cargo</label>
            <input
              type="text"
              className="form-control"
              name="cargo"
              value={nuevoPersonal.cargo}
              onChange={onChange}
            />
          </div>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              name="activo"
              checked={nuevoPersonal.activo}
              onChange={onChange}
              id="activoCheck"
            />
            <label className="form-check-label" htmlFor="activoCheck">
              Activo
            </label>
          </div>
          <div className="mb-2">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-control"
              name="usuario"
              value={nuevoPersonal.usuario}
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

export default ModalPersonalNuevo;