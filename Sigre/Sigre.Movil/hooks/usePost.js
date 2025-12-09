import { getPostArmadoMaterial, getPostById, getPostMaterial, getPostRetenidaMaterial, getPostRetenidaTipo } from "../database/offlineDB/posts";

export const usePost = () => {

  const getPostData = async (id) =>{
    let data = await getPostById(id);
    return data;
  }

  const getArmadoMaterialsPost = async () =>{
    let data = await getPostArmadoMaterial();
    return data;
  }

  const getMaterialsPost = async () =>{
    let data = await getPostMaterial();
    return data;
  }

  const getTipoRetenidasPost = async () =>{
    let data = await getPostRetenidaTipo();
    return data;
  }

  const getMaterialsRetenidasPost = async () =>{
    let data = await getPostRetenidaMaterial();
    return data;
  }

  return {
    getPostData,
    getArmadoMaterialsPost,
    getMaterialsPost,
    getTipoRetenidasPost,
    getMaterialsRetenidasPost
  };
};