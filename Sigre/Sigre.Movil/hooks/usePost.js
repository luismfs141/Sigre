import { useState } from "react";
import {
  getPostArmadoMaterial,
  getPostByIdLocal,
  getPostMaterial,
  getPostRetenidaMaterial,
  getPostRetenidaTipo,
  saveOrUpdatePost
} from "../database/offlineDB/posts";

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ------------------- OBTENER POSTE -------------------
  const getPostData = async (postInterno) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPostByIdLocal(postInterno);
      return data;
    } catch (err) {
      console.error("❌ Error obteniendo poste:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------- GUARDAR O ACTUALIZAR POSTE -------------------
  const savePost = async (post) => {
    setLoading(true);
    setError(null);
    try {
      const id = await saveOrUpdatePost(post);
      return id;
    } catch (err) {
      console.error("❌ Error guardando poste:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------- DATOS AUXILIARES -------------------
  const getMaterialsPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPostMaterial();
      return data;
    } catch (err) {
      console.error("❌ Error obteniendo materiales de poste:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getArmadoMaterialsPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPostArmadoMaterial();
      return data;
    } catch (err) {
      console.error("❌ Error obteniendo materiales de armado:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTipoRetenidasPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPostRetenidaTipo();
      return data;
    } catch (err) {
      console.error("❌ Error obteniendo tipos de retenidas:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getMaterialsRetenidasPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPostRetenidaMaterial();
      return data;
    } catch (err) {
      console.error("❌ Error obteniendo materiales de retenidas:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPostData,
    savePost,
    getMaterialsPost,
    getArmadoMaterialsPost,
    getTipoRetenidasPost,
    getMaterialsRetenidasPost
  };
};