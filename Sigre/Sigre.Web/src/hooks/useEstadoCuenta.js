import api from '../api/apiConfig';

export const useEstadoCuenta = () => {
    const crearCronogramaPorGrupo = async (idGrupo, fechaInicio) =>{
        try {
            const response = await api.post(`/EstadoCuenta/CrearCronograma?idGrupo=${idGrupo}&fechaInicio=${fechaInicio}`);

            if (response.data.exito) {
                return response.data;
              } else {
                throw new Error(response.data.Mensaje);
              }
        } catch (error) {
            console.error("Error al crear el cronograma", error);
        }
    };

    const ObtenerEstadosCuentaPorIdClienteGrupo = async(idCliente, idGrupo) =>{
        try{
            const response = await api.get(`/EstadoCuenta/GetEstadosCuentaIdClienteGrupo?idCliente=${idCliente}&idGrupo=${idGrupo}`);
            if(response.data.exito){
                return response.data;
            }
            else{
                throw new Error(response.data.Mensaje);
            }
        }
        catch (error){
            console.error("Error al obtener los estados de cuenta:", error);
        }   
    };

    return{
        crearCronogramaPorGrupo,
        ObtenerEstadosCuentaPorIdClienteGrupo
    };
}