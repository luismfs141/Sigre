import {api} from '../api/apiConfig';

export const usePoste = () => {
    const getPoles = (id) => {
        api().get('Poste/ObtenerPorAlimentador?x_Alim_Id=' + id)
        .then(resp => {
            return resp.data;
        });
    }

    return{
        getPoles
    }
}