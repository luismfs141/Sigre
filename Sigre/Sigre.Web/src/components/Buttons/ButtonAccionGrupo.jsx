import React, { useState, useEffect } from 'react';
import { useGrupo } from '../../hooks/useGrupo';
import { useDocumento } from '../../hooks/useDocumento';

const ButtonAccionGrupo = ({ cliente, grupo, onUnirseGrupo, onSolicitudes, onDocumentos, onIniciarGrupo }) => {
    const [estadoCliente, setEstadoCliente] = useState('');
    const [estadoGrupo, setEstadoGrupo] = useState('');
    const [estadoDocumento, setEstadoDocumento] = useState('');
    const [cantIntegrantes, setCantidadIntegrantes] = useState(0);
    const [esAdministrador, setEsAdministrador] = useState(false);
    const [esMiembroGrupo, setEsMiembroGrupo] = useState(false);

    const { getNumeroIntegrantesGrupo, getEsAdministradorGrupo, getEsMiembroGrupo } = useGrupo();
    const { getEstadoDocumentoClienteGrupo } = useDocumento();

    useEffect(() => {
        const fetchData = async () => {
            if (cliente && grupo) {
                const [estDocumento, numIntegrantesGrupo, esAdmin, esMiembro] = await Promise.all([
                    getEstadoDocumentoClienteGrupo(cliente.idClienteI, grupo.idGrupoI),
                    getNumeroIntegrantesGrupo(grupo.idGrupoI),
                    getEsAdministradorGrupo(cliente.idClienteI, grupo.idGrupoI),
                    getEsMiembroGrupo(cliente.idClienteI, grupo.idGrupoI)
                ]);

                setEstadoCliente(cliente.estadoC);
                setEstadoGrupo(grupo.estadoC);
                setCantidadIntegrantes(numIntegrantesGrupo);
                setEstadoDocumento(estDocumento);
                setEsAdministrador(esAdmin);
                setEsMiembroGrupo(esMiembro);
            }
        };

        fetchData();
    }, [cliente, grupo]);

    const renderButtonForAdmin = () => {
        if (estadoDocumento === 'A') {
            if (cantIntegrantes == grupo.cantMaxIntegrantesI ) {
                if(grupo.estadoC === 'A'){
                    return <button className="btn btn-success" onClick={() => onIniciarGrupo(grupo)}>Iniciar Cronograma</button>;
                }
                else{
                    return <button className="btn btn-success" disabled onClick={() => onIniciarGrupo(grupo)}>Cronograma Iniciado</button>;
                }
            }
            return <button className="btn btn-info" onClick={() => onSolicitudes(grupo)}>Solicitudes</button>;
        }

        if (estadoDocumento === 'P') {
            return <button className="btn btn-secondary" disabled>Verificando Documentos</button>;
        }

        return <button className="btn btn-warning" onClick={() => onDocumentos(grupo)}>Subir Documentos</button>;
    };

    const renderButtonForNonAdmin = () => {
        if (!esMiembroGrupo) {
            if (estadoDocumento === 'A') {
                return <button className="btn btn-primary" onClick={() => onUnirseGrupo(grupo)}>Solicitar Unión</button>;
            }
            if (estadoDocumento === 'P') {
                return <button className="btn btn-secondary" disabled>Verificando Documentos</button>;
            }
            return <button className="btn btn-warning" onClick={() => onDocumentos(grupo)}>Subir Documentos</button>;
        }
        else{
            if(grupo.estadoC == 'A'){
                return <button className="btn btn-success" disabled>Solicitud Aceptada</button>;
            }
            if(grupo.estadoC == 'F'){
                return <button className="btn btn-success" disabled>Cronograma Iniciado</button>;
            }
        }
        
    };

    return (
        <>
            {esAdministrador ? renderButtonForAdmin() : renderButtonForNonAdmin()}
        </>
    );
};

export default ButtonAccionGrupo;