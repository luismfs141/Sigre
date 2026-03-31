import { useState } from 'react';
import api from '../api/apiConfig';

export const useSed = () => {

    const [loading, setLoading] = useState(false);

    const getSedsByFeeder = async (feederId) => {

        if (!feederId) return [];

        setLoading(true);

        try {
            const response = await api.post('/Sed/GetSedsByFeeders', [feederId]);

            let data = response.data;

            if (response.data?.result) {
                data = response.data.result;
            }

            return Array.isArray(data) ? data : [];

        } catch (error) {
            console.error("Error obteniendo SEDs:", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return {
        getSedsByFeeder,
        loading
    };
};