import { useState } from "react";
import { executeSql, initTables } from "../database/helpers";
import {
  createDeficienciesTable,
  createFilesTable,
  createPostesTable,
  createSedsTable,
  createVanosTable,
} from "../database/schema";
import { downloadTable, uploadTable } from "../database/sync";

export const useOffline = () => {
  const [loading, setLoading] = useState(false);

  // Crear las tablas de la base de datos
  const setupDatabase = async () => {
    setLoading(true);
    try {
      await initTables([
        createDeficienciesTable,
        createFilesTable,
        createPostesTable,
        createVanosTable,
        createSedsTable,
      ]);
      alert("Base de datos inicializada correctamente");
    } catch (error) {
      console.error("Error al inicializar la base de datos", error);
      alert("Hubo un error al inicializar la base de datos");
    } finally {
      setLoading(false);
    }
  };

  // Descargar datos desde la API y guardarlos en la base local
  const downloadData = async () => {
    setLoading(true);

    const tables = [
      {
        localTable: "deficiencias",
        remoteTable: "Deficiencias",
        query: "INSERT OR REPLACE INTO Deficiencias VALUES (?,?,?,?,?)",
      },
      {
        localTable: "archivos",
        remoteTable: "Archivos",
        query: "INSERT OR REPLACE INTO Archivos VALUES (?,?,?,?,?,?)",
      },
      {
        localTable: "postes",
        remoteTable: "Postes",
        query: "INSERT OR REPLACE INTO Postes VALUES (?,?,?,?,?,?)",
      },
      {
        localTable: "vanos",
        remoteTable: "Vanos",
        query: "INSERT OR REPLACE INTO Vanos VALUES (?,?,?,?,?,?)",
      },
      {
        localTable: "seds",
        remoteTable: "Seds",
        query: "INSERT OR REPLACE INTO Seds VALUES (?,?,?,?,?,?)",
      },
    ];

    try {
      for (const { localTable, remoteTable, query } of tables) {
        await downloadTable(localTable, remoteTable, query);
      }
      alert("Datos descargados correctamente");
    } catch (error) {
      console.error("Error al descargar los datos", error);
      alert("Hubo un error al descargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Subir datos pendientes (pendingSync = 1) desde la base local hacia el servidor
  const uploadData = async () => {
    setLoading(true);

    const tables = [
      {
        localTable: "Deficiencias",
        remoteTable: "deficiencias",
        query: "SELECT * FROM Deficiencias WHERE pendingSync = 1",
      },
      {
        localTable: "Archivos",
        remoteTable: "archivos",
        query: "SELECT * FROM Archivos WHERE pendingSync = 1",
      },
      {
        localTable: "Postes",
        remoteTable: "postes",
        query: "SELECT * FROM Postes WHERE pendingSync = 1",
      },
      {
        localTable: "Vanos",
        remoteTable: "vanos",
        query: "SELECT * FROM Vanos WHERE pendingSync = 1",
      },
      {
        localTable: "Seds",
        remoteTable: "seds",
        query: "SELECT * FROM Seds WHERE pendingSync = 1",
      },
    ];

    try {
      for (const { localTable, remoteTable, query } of tables) {
        await uploadTable(localTable, remoteTable, query);
      }
      alert("Datos subidos correctamente");
    } catch (error) {
      console.error("Error al subir los datos", error);
      alert("Hubo un error al subir los datos");
    } finally {
      setLoading(false);
    }
  };

  // Obtener todos los datos de una tabla local
  const getTableData = async (tableName) => {
    try {
      const result = await executeSql(`SELECT * FROM ${tableName}`);
      const rows = [];
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(result.rows.item(i));
      }
      return rows;
    } catch (error) {
      console.error(`Error al obtener datos de la tabla ${tableName}:`, error);
      return [];
    }
  };

  return {
    loading,
    setupDatabase,
    downloadData,
    uploadData,
    getTableData,
  };
};