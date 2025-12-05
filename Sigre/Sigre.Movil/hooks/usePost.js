import { useDatos } from "../context/DatosContext";
import { getPostById } from "../database/offlineDB/posts";

export const usePost = () => {
  const { setSelectedItem } = useDatos();

  const getPostData = async (id) =>{
    let data = await getPostById(id);
    return data;
  }

  return {
    getPostData
  };
};