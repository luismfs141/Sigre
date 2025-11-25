import { useDatos } from "../context/DatosContext";
import { getPostById } from "../database/offlineDB/posts";

export const usePost = () => {
  const { setSelectedPost } = useDatos();

  const fetchAndSelectPost = async (id) => {
    let data = await getPostById(id);
    if (!Array.isArray(data)) data = [];

    const postsData = data.map(post => ({
      ...post,
      PostLatitud: Number(post.PostLatitud),
      PostLongitud: Number(post.PostLongitud)
    }));

    setSelectedPost(postsData[0] || null);
    console.log(postsData);
    return postsData;
  };

  return {
    fetchAndSelectPost
  };
};