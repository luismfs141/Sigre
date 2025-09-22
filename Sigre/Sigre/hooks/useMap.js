import { api } from '../api/apiConfig';
import { appSettings, controlError } from '../utils/utils';
import { useDispatch,useSelector } from 'react-redux';
import { setIsLoading, setIsLoadingMessage,setTotalPins,setPins,setGaps,setRegion } from "../context/actions/Actions";

export const useMap = () => {
    const dispatch = useDispatch();
    const { totalPins,selectedPin } = useSelector(state => state.AppReducer);

    const getGapsByFeeder = ( x_feeder_id ) => {
        dispatch(setIsLoadingMessage("Cargando vanos ..."));
        dispatch(setIsLoading(true));
        api().get('Gap/GetByFeeder?x_feeder_id=' + x_feeder_id, { timeout: appSettings.getTimeout })
        .then(resp => {
            dispatch(setGaps(resp.data));
            dispatch(setIsLoading(false));
        })
        .catch(error => controlError(error, dispatch));
    }

    const getPinsByFeeder = ( x_feeder_id ) => {
        dispatch(setIsLoadingMessage("Cargando pines ..."));
        dispatch(setIsLoading(true));
        api().get('Pin/GetByFeeder?x_feeder_id='+ x_feeder_id, { timeout: appSettings.getTimeout })
        .then(resp => {
            dispatch(setTotalPins(resp.data));
            var maxLat = Math.max(...resp.data.map(s =>s.latitude));
            var minLat = Math.min(...resp.data.map(s =>s.latitude));
            var maxLng = Math.max(...resp.data.map(s =>s.longitude));
            var minLng = Math.min(...resp.data.map(s =>s.longitude));
            if(selectedPin==null){
                dispatch(setRegion({
                    latitude: (maxLat - minLat) / 2 + minLat, 
                    longitude: (maxLng - minLng) / 2 + minLng,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421
                }))
            }
            dispatch(setIsLoading(false));
        })
        .catch(error => controlError(error, dispatch))
    }
    
    const getPinsByRegion = (region) => {
        if (region.latitudeDelta < 0.005) {
            var maxLatitud = region.latitude + region.latitudeDelta;
            var minLatitud = region.latitude - region.latitudeDelta;
            var maxLongitud = region.longitude + region.longitudeDelta;
            var minLongitud = region.longitude - region.longitudeDelta;

            dispatch(setPins(totalPins.filter(p=>
                p.latitude > minLatitud &&
                p.latitude <= maxLatitud &&
                p.longitude > minLongitud &&
                p.longitude <= maxLongitud)));
        }
        else{
            dispatch(setPins([]));
        }
    }

    const setRegionByCoordinate = (latitude, longitude) =>{
        dispatch(setRegion({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.0005,
            longitudeDelta: 0.0005
        }))
    }

    const drawMapByFeeder = (idFeeder) =>{
        let result = null;

        result = api().post('Feeder/drawMap/',idFeeder)
        .then((resp)=>{
            console.log("Mapa Actualizado");
        })
        .catch(error => console.log("Error"));
    }

    return {
        getGapsByFeeder,
        getPinsByFeeder,
        getPinsByRegion,
        setRegionByCoordinate,
        drawMapByFeeder
    }
}