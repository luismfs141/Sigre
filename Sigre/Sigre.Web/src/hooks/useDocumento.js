import api from '../api/apiConfig';

export const useDocumento = () => {

    const guardarDocumento = async (documentoData, clienteData, grupoData) => {
        try {
            // Verifica si los archivos existen antes de convertirlos
            if (documentoData.documentoIdentidad) {
                const docIdentidad = await convertirArchivoEnBase64(documentoData.documentoIdentidad);
                documentoData.documentoIdentidad = docIdentidad;
            }

            if (documentoData.antecedentesPenales) {
                const docPenales = await convertirArchivoEnBase64(documentoData.antecedentesPenales);
                documentoData.antecedentesPenales = docPenales;
            }

            if (documentoData.reciboAguaLuz) {
                const docAguaLuz = await convertirArchivoEnBase64(documentoData.reciboAguaLuz);
                documentoData.reciboAguaLuz = docAguaLuz;
            }

            // Crear el objeto de solicitud
            const request = { 'Documento': documentoData, 'Cliente': clienteData, 'Grupo': grupoData };

            const response = await api.post('/Documento/GuardarDocumento', request);
            
            if (response.data.exito) {
                return response.data;
            } else {
                throw new Error(response.data.Mensaje);
            }
        } catch (error) {
            console.error("Error al guardar el documento:", error);
            throw error;
        }
    };

    const getDocumentoPorClienteGrupo = async (clienteData,grupoData)=>{
        try {
            const request = {'Cliente':clienteData,'Grupo':grupoData};
            const response = await api.post('/Documento/ObtenerDocumentoPorClienteGrupo',request);
            //console.log(response.data.objeto);
            return response.data.objeto;
        } catch (error) {
            console.error("Error al obtener los grupos:", error);
        }
    };

    const getEstadoDocumentoClienteGrupo = async(idCliente, idGrupo) =>{
        try{
            const response = await api.get(`/Documento/ObtenerEstadoDocumentoClienteGrupo?idCliente=${idCliente}&idGrupo=${idGrupo}`);
            
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

    const convertirArchivoEnBase64 = (archivo) => {
        return new Promise((resolve, reject) => {
            if (!(archivo instanceof Blob)) {
                reject(new Error('El archivo proporcionado no es de tipo Blob.'));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(archivo);
        });
    };

    return{
        guardarDocumento,
        getDocumentoPorClienteGrupo,
        getEstadoDocumentoClienteGrupo
    }
}