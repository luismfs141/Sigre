import api from '../api/apiConfig';

export const useGrupo = () => {

    const getGruposPorCliente = async (clienteData) =>{
        try {
            const response = await api.get(`/Grupo/ObtenerGruposPorCliente?idCliente=${clienteData.idClienteI}`);
            // Aseguramos que 'response.data.objeto' siempre sea un arreglo
            return Array.isArray(response.data.objeto) ? response.data.objeto : [];
        } catch (error) {
            console.error("Error al obtener los grupos:", error);
            return [];
        }
    };

    const guardarGrupo = async (clienteData,grupoData) =>{
        try {
            const request = {'Cliente':clienteData,'Grupo':grupoData};
            const response = await api.post('/Grupo/GuardarGrupo',request);

            if (response.data.exito) {
                return response.data;
              } else {
                throw new Error(response.data.Mensaje);
              }
        } catch (error) {
            console.error("Error al obtener los grupos:", error);
        }
    };

    const buscarGrupoCodigo = async (codigoGrupo) =>{
        try{
            const response = await api.get(`/Grupo/ObtenerGrupoPorCodigo?codigoGrupo=${codigoGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al obtener los grupos:", error);
        }
    };

    const agregarListaGrupoCliente = async (grupoData, clienteData) =>{
        try{
            const request = {'Cliente':clienteData,'Grupo':grupoData};
            const response = await api.post('/Grupo/AgregarListaGrupoCliente', request);
            if(response.data.exito){
                return response.data;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al obtener los grupos:", error);
        }
    };

    const getDetallesGrupo = async (idGrupo) =>{
        try{
            const response = await api.get(`/Grupo/ObtenerDetallesPorIdGrupo?idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al obtener los detalles de grupo:", error);
        }       
    };

    const agregarListaEsperaGrupo = async(idCliente, idGrupo) =>{
        try{
            const response = await api.post(`/Grupo/UnirseListaPendienteGrupo?idCliente=${idCliente}&idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al agregar en la lista de espera de grupo:", error);
        }       
    };

    const listarClientesPendientes = async(idGrupo) => {
        try{
            const response = await api.get(`/Grupo/ListarClientesPendientesIdGrupo?idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al agregar en la lista de espera de grupo:", error);
        }      
    };

    const admitirClienteGrupo = async(idCliente, idGrupo) =>{
        try{
            const response = await api.post(`/Grupo/AdmitirClienteGrupo?idCliente=${idCliente}&idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error admitir cliente en el grupo:", error);
        }   
    };

    const rechazarClienteGrupo = async(idCliente, idGrupo) =>{
        try{
            const response = await api.post(`/Grupo/RechazarClienteGrupo?idCliente=${idCliente}&idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al rechazar el cliente:", error);
        }   
    };

    const getNumeroIntegrantesGrupo = async(idGrupo) =>{
        try{
            const response = await api.get(`/Grupo/ObtenerNumeroIntegrantesIdGrupo?idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al agregar en la lista de espera de grupo:", error);
        }   
    };

    const getEsAdministradorGrupo = async(idCliente, idGrupo) =>{
        try{
            const response = await api.get(`/Grupo/EsAdministradorGrupo?idCliente=${idCliente}&idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error comprobar cliente:", error);
        }   
    };

    const getEsMiembroGrupo = async(idCliente, idGrupo) =>{
        try{
            const response = await api.get(`/Grupo/EsMiembroGrupo?idCliente=${idCliente}&idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data.objeto;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error comprobar cliente:", error);
        }   
    };

    return{
        getGruposPorCliente,
        guardarGrupo,
        buscarGrupoCodigo,
        agregarListaGrupoCliente,
        getDetallesGrupo,
        agregarListaEsperaGrupo,
        listarClientesPendientes,
        admitirClienteGrupo,
        rechazarClienteGrupo,
        getNumeroIntegrantesGrupo,
        getEsAdministradorGrupo,
        getEsMiembroGrupo
    };
};