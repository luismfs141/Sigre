import { useDatos } from "../context/DatosContext";
import { getSedById } from "../database/offlineDB/seds";

export const useSed = () => {
  const { setSelectedItem } = useDatos();

  const fetchAndSelectSed = async (id) => {
    let data = await getSedById(id);

    setSelectedItem(data);
    return data;
  };

  return {
    fetchAndSelectSed
  };
};