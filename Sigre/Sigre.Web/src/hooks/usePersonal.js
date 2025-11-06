import { useState } from 'react';
import api from '../api/apiConfig';

export const usePersonal = () =>{

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const savePersonal = async( personal )=> {
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('x_personal', personal);

            const response = await api.post('/Personal/SavePersonal', formData);

            if (response.data) {
                const personalData = response.data;
                return personalData;
            } else {
            setError('Credenciales inválidas.');
            throw new Error('Credenciales inválidas.');
            }
        } catch (err) {
            console.error('Error de login:', err);
            setError(err.response?.data?.mensaje || 'Error al intentar hacer login');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return{
        savePersonal,
        loading,
        error
    };
}