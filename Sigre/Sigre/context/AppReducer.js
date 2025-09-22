import { types } from "../types/Types";

const initialState = {
    selectedPin: {},
    selectedTypification:{},
    isLoading: false,
    isLoadingMessage: "Cargando ...",
    isOnline: false,
    pins: [],
    totalPins: [],
    gaps: [],
    feeders: [],
    files: [],
    deficiencies: [],
    supervisores: [
        '9ddb380e33a1e8da',
        'a5af527174115615'],
    user:{}
}

function AppReducer(state = initialState, action) {
    switch ( action.type ) {
        case types.setSelectedPin:
            return {
                ...state,
                selectedPin: action.payload
            };
        case types.setSelectedFeeder:
            return{
                ...state,
                selectedFeeder: action.payload
            };
        case types.setFeeders:
            return {
                ...state,
                feeders: action.payload
            };
        case types.setSelectedDeficiency:
            return{
                    ...state,
                    selectedDeficiency: action.payload
            };
        case types.setTypifications:
            return{
                    ...state,
                    typifications: action.payload
            };
        case types.setIdPhone:
            return{
                    ...state,
                    idPhone: action.payload
            };
        case types.setPhoto:
            return{
                    ...state,
                    photo: action.payload
            };
        case types.setControlSave:
            return{
                    ...state,
                    controlSave: action.payload
            };
        case types.setIsLoading:
            return {
                ...state,
                isLoading: action.payload
            };
        case types.setIsLoadingMessage:
            return {
                ...state,
                isLoadingMessage: action.payload
            }
        case types.setDateSelect:
            return {
                ...state,
                dateSelect: action.payload
            }
        case types.setTypeForm:
            return {
                ...state,
                typeForm: action.payload
            }
        case types.setIdDeficiency:
            return {
                ...state,
                idDeficiency: action.payload
            }
        case types.setUserMod:
            return {
                ...state,
                userMod: action.payload
            }
        case types.setIsOnline:
            return{
                ...state,
                isOnline: action.payload
            }
        case types.setTotalPins:
        return{
            ...state,
            totalPins: action.payload
            }
        case types.setGaps:
            return{
                ...state,
                gaps: action.payload
            }
        case types.setPins:
            return{
                ...state,
                pins: action.payload
            }
        case types.setRegion:
            return{
                ...state,
                region: action.payload
            }
        case types.setFiles:
            return{
                ...state,
                files: action.payload
            }
        case types.setDeficiencies:
            return{
                ...state,
                deficiencies: action.payload
            }
        case types.setSupervisores:
            return{
                ...state,
                supervisores: action.payload
            }
        case types.setUser:
            return{
                ...state,
                user: action.payload
            }
        case types.setSelectedUser:
            return{
                ...state,
                selectedUser: action.payload
            }
        default:
            return state;
    }
}

export default AppReducer;