import { useDatos } from "../context/DatosContext";
import { getPostById } from "../database/offlineDB/posts";

export const usePost = () => {
  const { setSelectedItem } = useDatos();

  const fetchAndSelectPost = async (id) => {
    let data = await getPostById(id);
    setSelectedItem(data);
    return data;
  };

  return {
    fetchAndSelectPost
  };
};