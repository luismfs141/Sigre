import { api } from "../config";
import { executeSql } from "./helpers";

const client = api(); // instancia de axios lista

export const downloadTable = async (endpoint, table, insertSql) => {
  const res = await client.get(endpoint);
  const data = res.data;

  for (let row of data) {
    await executeSql(insertSql, Object.values(row));
  }
};

export const uploadTable = async (table, endpoint, selectSql) => {
  const res = await executeSql(selectSql);

  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows.item(i);

    await client.post(endpoint, row);

    await executeSql(`UPDATE ${table} SET pendingSync = 0 WHERE rowid = ?`, [
      row.rowid,
    ]);
  }
};