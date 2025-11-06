import React, { useState } from 'react';

const ModalVoucher = ({ show, onClose, onSave }) => {
  // Estado para los archivos y datos del documento
  const [documentos, setDocumentos] = useState({
    idDocumento: 0,
    documentoIdentidad: '',
    antecedentesPenales: '',
    reciboAguaLuz: '',
    docFax: '',
    estado: 'P',
    fechaAprovacion: null,
  });

  // Maneja el cambio de archivos
  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentos((prevState) => ({
        ...prevState,
        [docType]: file,
      }));
    }
  };

  // Maneja los cambios en los campos de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentos((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Maneja el envío de los datos del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(documentos); // Enviar los datos al controlador
  };

  return (
    <div className={`modal ${show ? 'show' : ''}`} tabIndex="-1" style={{ display: show ? 'block' : 'none' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Subir Documentos</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="documentoIdentidad" className="form-label">Imagen Voucher</label>
                <input
                  type="file"
                  className="form-control"
                  id="documentoIdentidad"
                  onChange={(e) => handleFileChange(e, 'documentoIdentidad')}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="estado" className="form-label">Estado</label>
                <select
                  className="form-control"
                  id="estado"
                  name="estado"
                  value={documentos.estado}
                  onChange={handleInputChange}
                  disabled
                >
                  <option value="P">Pendiente</option>
                  <option value="A">Aprobado</option>
                  <option value="R">Rechazado</option>
                  <option value="O">Observado</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="fechaAprovacion" className="form-label">Fecha de Aprobación</label>
                <input
                  type="date"
                  className="form-control"
                  id="fechaAprovacion"
                  name="fechaAprovacion"
                  value={documentos.fechaAprovacion}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVoucher;