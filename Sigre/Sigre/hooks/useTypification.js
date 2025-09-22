import { api } from '../api/apiConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setTypifications } from '../context/actions/Actions';
import { getTableFromByPinType } from '../utils/utils';

export const useTypification = () =>{

    const dispatch = useDispatch();
    const { typifications } = useSelector(state => state.AppReducer);

    const getTypificationsByPinType = (x_pinType) => {
        var table = getTableFromByPinType(x_pinType);
        var results = typifications.filter(t => t.tableId == table.id)
        results.unshift({
            id:0,
            label:"Seleccione una tipificación",
            table:"Seleccione una tipificación",
            component:"",
            code:"",
            typification:""
        })
        return results;
    }
    const getAll = () => {
        api().get('Typification/GetAll')
        .then(resp => {
            dispatch(setTypifications(resp.data));
        });
    }
    return{
        getTypificationsByPinType,
        getAll
    }
}