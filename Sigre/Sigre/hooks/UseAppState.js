import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const useAppState = () => {
    const {
        appState,
        setSelectedPin
    } = useContext ( AppContext );

    const {
        selectedPin
    } = appState;

    return {
        selectedPin,
        setSelectedPin
    }
}