import { types } from '../../types/Types';

export const setSelectedPin = (selectedPin) => dispatch => {
    dispatch({
        type: types.setSelectedPin,
        payload: selectedPin
    });
}

export const setSelectedFeeder = (selectedFeeder) => dispatch => {
    dispatch({
        type: types.setSelectedFeeder,
        payload: selectedFeeder
    });
}

export const setFeeders = (feeders) =>  dispatch => {
    dispatch({
        type: types.setFeeders,
        payload: feeders
    });
}

export const setSelectedDeficiency = (selectedDeficiency) => dispatch => {
    dispatch({
        type: types.setSelectedDeficiency,
        payload: selectedDeficiency
    });
}

export const setTypifications = (typifications) => dispatch => {
    dispatch({
        type: types.setTypifications,
        payload: typifications
    });
}

export const setIdPhone = (idPhone) => dispatch => {
    dispatch({
        type: types.setIdPhone,
        payload: idPhone
    });
}

export const setPhoto = (photo) => dispatch => {
    dispatch({
        type: types.setPhoto,
        payload: photo
    });
}

export const setControlSave = (controlSave) => dispatch => {
    dispatch({
        type: types.setControlSave,
        payload: controlSave
    });
}

export const setIsLoading = (isLoading) => dispatch => {
    dispatch({
        type: types.setIsLoading,
        payload: isLoading
    });
}

export const setIsLoadingMessage = (isLoadingMessage) => dispatch => {
    dispatch({
        type: types.setIsLoadingMessage,
        payload: isLoadingMessage
    })
}

export const setDateSelect = (dateSelect) => dispatch => {
    dispatch({
        type: types.setDateSelect,
        payload: dateSelect
    })
}

export const setTypeForm = (typeForm) => dispatch => {
    dispatch({
        type: types.setTypeForm,
        payload: typeForm
    })
}

export const setIdDeficiency = (idDeficiency) => dispatch => {
    dispatch({
        type: types.setIdDeficiency,
        payload: idDeficiency
    })
}

export const setUserMod = (userMod) => dispatch => {
    dispatch({
        type: types.setUserMod,
        payload: userMod
    })
}

export const setIsOnline = (isOnline) => dispatch => {
    dispatch({
        type: types.setIsOnline,
        payload: isOnline
    })
}
export const setTotalPins = (totalPins) => dispatch =>{
    dispatch({
        type: types.setTotalPins,
        payload: totalPins
    })
}
export const setPins = (pins) => dispatch =>{
    dispatch({
        type: types.setPins,
        payload: pins
    })
}
export const setGaps = (gaps) => dispatch =>{
    dispatch({
        type: types.setGaps,
        payload: gaps
    })
}
export const setRegion = (region) => dispatch =>{
    dispatch({
        type: types.setRegion,
        payload: region
    })
}
export const setFiles = (files) => dispatch =>{
    dispatch({
        type: types.setFiles,
        payload: files
    })
}
export const setDeficiencies = (deficiencies) => dispatch =>{
    dispatch({
        type: types.setDeficiencies,
        payload: deficiencies
    })
}
export const setSupervisores = (supervisores) => dispatch =>{
    dispatch({
        type: types.setSupervisores,
        payload: supervisores
    })
}
export const setUser = (user) => dispatch =>{
    dispatch({
        type: types.setUser,
        payload: user
    })
}
export const setSelectedUser = (selectedUser) => dispatch =>{
    dispatch({
        type: types.setSelectedUser,
        payload: selectedUser
    })
}