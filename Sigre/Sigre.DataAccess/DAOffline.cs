using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.SyncData;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAOffline
    {
        public async Task<List<DeficienciaSyncDto>> DAOFF_LeerDeficienciasDesdeSqlite(string sqlitePath)
        {
            var deficiencias = new List<DeficienciaSyncDto>();

            using (var connection = new SqliteConnection($"Data Source={sqlitePath}"))
            {
                await connection.OpenAsync();

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT * FROM Deficiencias";

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var def = new DeficienciaSyncDto
                            {
                                DefiInterno = reader.GetNullableInt32("DefiInterno") ?? 0,
                                DefiEstado = reader.GetNullableString("DefiEstado"),
                                InspInterno = reader.GetNullableInt32("InspInterno"),
                                TablInterno = reader.GetNullableInt32("TablInterno"),
                                DefiCodigoElemento = reader.GetNullableString("DefiCodigoElemento"),
                                TipiInterno = reader.GetNullableInt32("TipiInterno"),
                                DefiNumSuministro = reader.GetNullableString("DefiNumSuministro"),
                                DefiFechaDenuncia = reader.GetNullableDateTime("DefiFechaDenuncia"),
                                DefiFechaInspeccion = reader.GetNullableDateTime("DefiFechaInspeccion"),
                                DefiFechaSubsanacion = reader.GetNullableDateTime("DefiFechaSubsanacion"),
                                DefiObservacion = reader.GetNullableString("DefiObservacion"),
                                DefiEstadoSubsanacion = reader.GetNullableString("DefiEstadoSubsanacion"),
                                DefiLatitud = reader.GetNullableDouble("DefiLatitud") ?? 0,
                                DefiLongitud = reader.GetNullableDouble("DefiLongitud") ?? 0,
                                DefiTipoElemento = reader.GetNullableString("DefiTipoElemento"),
                                DefiDistHorizontal = reader.GetNullableDecimal("DefiDistHorizontal"),
                                DefiDistVertical = reader.GetNullableDecimal("DefiDistVertical"),
                                DefiDistTransversal = reader.GetNullableDecimal("DefiDistTransversal"),
                                DefiIdElemento = reader.GetNullableInt32("DefiIdElemento"),
                                DefiFecRegistro = reader.GetNullableDateTime("DefiFecRegistro") ?? DateTime.MinValue,
                                DefiCodDef = reader.GetNullableString("DefiCodDef"),
                                DefiCodRes = reader.GetNullableInt32("DefiCodRes"),
                                DefiCodDen = reader.GetNullableInt32("DefiCodDen"),
                                DefiRefer1 = reader.GetNullableString("DefiRefer1"),
                                DefiRefer2 = reader.GetNullableString("DefiRefer2"),
                                DefiCoordX = reader.GetNullableDouble("DefiCoordX"),
                                DefiCoordY = reader.GetNullableDouble("DefiCoordY"),
                                DefiCodAmt = reader.GetNullableString("DefiCodAmt"),
                                DefiNroOrden = reader.GetNullableString("DefiNroOrden"),
                                DefiPointX = reader.GetNullableDouble("DefiPointX"),
                                DefiPointY = reader.GetNullableDouble("DefiPointY"),
                                DefiUsuCre = reader.GetNullableString("DefiUsuCre") ?? string.Empty,
                                DefiUsuNpc = reader.GetNullableString("DefiUsuNpc") ?? string.Empty,
                                DefiFecModificacion = reader.GetNullableDateTime("DefiFecModificacion"),
                                DefiFechaCreacion = reader.GetNullableDateTime("DefiFechaCreacion"),
                                DefiTipoMaterial = reader.GetNullableString("DefiTipoMaterial"),
                                DefiNodoInicial = reader.GetNullableString("DefiNodoInicial"),
                                DefiNodoFinal = reader.GetNullableString("DefiNodoFinal"),
                                DefiTipoRetenida = reader.GetNullableString("DefiTipoRetenida"),
                                DefiRetenidaMaterial = reader.GetNullableString("DefiRetenidaMaterial"),
                                DefiTipoArmado = reader.GetNullableString("DefiTipoArmado"),
                                DefiArmadoMaterial = reader.GetNullableString("DefiArmadoMaterial"),
                                DefiNumPostes = reader.GetNullableInt32("DefiNumPostes"),
                                DefiPozoTierra = reader.GetNullableString("DefiPozoTierra"),
                                DefiResponsable = reader.GetNullableBool("DefiResponsable"),
                                DefiComentario = reader.GetNullableString("DefiComentario"),
                                DefiPozoTierra2 = reader.GetNullableString("DefiPozoTierra2"),
                                DefiUsuarioInic = reader.GetNullableString("DefiUsuarioInic") ?? string.Empty,
                                DefiUsuarioMod = reader.GetNullableString("DefiUsuarioMod") ?? string.Empty,
                                DefiActivo = reader.GetNullableBool("DefiActivo"),
                                DefiEstadoCriticidad = reader.GetNullableInt32("DefiEstadoCriticidad"),
                                DefiInspeccionado = reader.GetNullableBool("DefiInspeccionado") ?? false,
                                DefiAccesibilidad = reader.GetNullableString("DefiAccesibilidad"),
                                DefiTipoCruce = reader.GetNullableString("DefiTipoCruce"),
                                DefiCol1 = reader.GetNullableString("DefiCol1"),
                                DefiCol2 = reader.GetNullableString("DefiCol2"),
                                DefiCol3 = reader.GetNullableString("DefiCol3"),
                                CodopInterno = reader.GetNullableInt32("CodopInterno"),
                                EstadoOffLine = reader.GetNullableInt32("EstadoOffLine") ?? 0,
                                DefiServerId = reader.GetNullableInt32("DefiServerId")
                            };

                            deficiencias.Add(def);
                        }
                    }
                }
            }

            return deficiencias;
        }

        public async Task<List<ArchivoSyncDto>> DAOFF_LeerArchivosDesdeSqliteAsync(string sqlitePath)
        {
            var archivos = new List<ArchivoSyncDto>();

            using (var connection = new SqliteConnection($"Data Source={sqlitePath}"))
            {
                await connection.OpenAsync();

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT * FROM Archivos";

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var archivo = new ArchivoSyncDto
                            {
                                ArchInterno = reader.GetNullableInt32("ArchInterno") ?? 0,
                                ArchTipo = reader.GetNullableString("ArchTipo"),
                                ArchTabla = reader.GetNullableString("ArchTabla"),
                                ArchCodTabla = reader.GetNullableInt32("ArchCodTabla"),
                                ArchNombre = reader.GetNullableString("ArchNombre"),
                                ArchLatitud = reader.GetNullableDouble("ArchLatitud"),
                                ArchLongitud = reader.GetNullableDouble("ArchLongitud"),
                                ArchFecha = reader.GetNullableDateTime("ArchFecha"),
                                ArchTipoElemento = reader.GetNullableString("ArchTipoElemento"),
                                ArchIdElemento = reader.GetNullableInt32("ArchIdElemento"),
                                TipiInterno = reader.GetNullableInt32("TipiInterno"),
                                ArchActivo = reader.GetNullableBool("ArchActivo") ?? false,
                                EstadoOffLine = reader.GetNullableInt32("EstadoOffLine") ?? 0,
                                DefiServerId = reader.GetNullableInt32("DefiServerId") ?? 0
                            };

                            archivos.Add(archivo);
                        }
                    }
                }
            }

            return archivos;
        }


        public async Task<(int defInsertadas, int defModificadas, int archInsertados, int archModificados )> DAOFF_SyncDataOffline(string sqlitePath)
        {
            int defInsertadas = 0;
            int defModificadas = 0;
            int archInsertados = 0;
            int archModificados = 0;

            var dADeficiency = new DADeficiency();
            var dAFile = new DAFile();

            // =====================================================
            // 1️⃣ LEER DATA OFFLINE (SQLITE)
            // =====================================================

            var deficiencias_off = (await DAOFF_LeerDeficienciasDesdeSqlite(sqlitePath))
                .Where(x => x.EstadoOffLine != 0)
                .ToList();

            var archivos_off = (await DAOFF_LeerArchivosDesdeSqliteAsync(sqlitePath))
                .Where(x => x.EstadoOffLine != 0)
                .ToList();

            var seds_off = await DAOFF_LeerSedsDesdeSqlite(sqlitePath);

            var sedInternos = seds_off
                .Where(s => s.SedInterno > 0)
                .Select(s => s.SedInterno)
                .Distinct()
                .ToList();

            if (sedInternos.Count == 0)
                return (0, 0, 0, 0);

            // =====================================================
            // 2️⃣ DATA ONLINE INICIAL
            // =====================================================

            DataTable dtDefOnline =
                dADeficiency.DADEFI_GetDeficienciasBySedsDT(sedInternos);

            DataTable dtArchOnline =
                dAFile.DAARCH_GetArchivosBySedsDT(sedInternos);

            // =====================================================
            // 3️⃣ CONVERTIR DEFICIENCIAS OFFLINE
            // =====================================================

            var deficiencias = deficiencias_off
                .Select(d => dADeficiency.DADEFI_ConvertDeficiency(d))
                .ToList();

            // =====================================================
            // 4️⃣ RESOLVER DEFICIENCIAS (INTERNO + UUID)
            // =====================================================

            deficiencias = DAOFF_ResolverDeficienciasInternoSimple(
                dtDefOnline,
                deficiencias
            );

            // =====================================================
            // 5️⃣ GUARDAR DEFICIENCIAS
            // =====================================================

            foreach (var def in deficiencias)
            {
                if (def.DefiInterno > 0)
                    defModificadas++;
                else
                    defInsertadas++;

                dADeficiency.DADEFI_Save(def);
            }

            // =====================================================
            // 6️⃣ 🔄 RECARGAR DEFICIENCIAS ONLINE (ACTUALIZADO)
            // =====================================================

            dtDefOnline = dADeficiency.DADEFI_GetDeficienciasBySedsDT(sedInternos);

            // =====================================================
            // 7️⃣ CONVERTIR ARCHIVOS OFFLINE
            // =====================================================

            var archivos = archivos_off
                .Select(a => dAFile.ARCH_ConvertFile(a))
                .ToList();

            // =====================================================
            // 8️⃣ RESOLVER ARCHIVOS (DEFICIENCIA + ARCHIVO)
            // =====================================================

            archivos = DAOFF_ResolverArchivosInternoSimple(
                dtDefOnline,
                dtArchOnline,
                archivos
            );

            // =====================================================
            // 9️⃣ GUARDAR ARCHIVOS
            // =====================================================

            foreach (var arch in archivos)
            {
                if (arch.ArchCodTabla <= 0)
                    continue; // no se guarda archivo sin deficiencia

                if (arch.ArchInterno > 0)
                    archModificados++;
                else
                    archInsertados++;

                dAFile.DAARCH_Save(arch);
            }

            return (
                defInsertadas,
                defModificadas,
                archInsertados,
                archModificados
            );
        }


        public async Task<List<SedSyncDto>> DAOFF_LeerSedsDesdeSqlite(string sqlitePath)
        {
            var seds = new List<SedSyncDto>();

            using (var connection = new SqliteConnection($"Data Source={sqlitePath}"))
            {
                await connection.OpenAsync();

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = @"
                SELECT
                    SedInterno,
                    EstadoOffLine,
                    SedEtiqueta,
                    SedLatitud,
                    SedLongitud,
                    SedTipo,
                    AlimInterno,
                    SedCodigo,
                    SedSimbolo,
                    SedTerceros,
                    SedMaterial,
                    SedInspeccionado,
                    SedNumPostes,
                    SedArmadoTipo,
                    SedArmadoMaterial,
                    SedRetenidaTipo,
                    SedRetenidaMaterial
                FROM Seds";

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            seds.Add(new SedSyncDto
                            {
                                SedInterno = reader.GetNullableInt32("SedInterno") ?? 0,
                                EstadoOffLine = reader.GetNullableInt32("EstadoOffLine") ?? 0,
                                SedEtiqueta = reader.GetNullableString("SedEtiqueta"),
                                SedLatitud = reader.GetNullableDouble("SedLatitud"),
                                SedLongitud = reader.GetNullableDouble("SedLongitud"),
                                SedTipo = reader.GetNullableString("SedTipo"),
                                AlimInterno = reader.GetNullableInt32("AlimInterno"),
                                SedCodigo = reader.GetNullableString("SedCodigo"),
                                SedSimbolo = reader.GetNullableString("SedSimbolo"),
                                SedTerceros = reader.GetNullableBool("SedTerceros"),
                                SedMaterial = reader.GetNullableString("SedMaterial"),
                                SedInspeccionado = reader.GetNullableBool("SedInspeccionado"),
                                SedNumPostes = reader.GetNullableInt32("SedNumPostes"),
                                SedArmadoTipo = reader.GetNullableString("SedArmadoTipo"),
                                SedArmadoMaterial = reader.GetNullableString("SedArmadoMaterial"),
                                SedRetenidaTipo = reader.GetNullableString("SedRetenidaTipo"),
                                SedRetenidaMaterial = reader.GetNullableString("SedRetenidaMaterial")
                            });
                        }
                    }
                }
            }

            return seds;
        }


        public List<Deficiencia> DAOFF_ResolverDeficienciasInternoSimple( DataTable dtDefOnline, List<Deficiencia> deficienciasOffline )
{
            foreach (var def in deficienciasOffline)
            {
                int defiInterno = 0;
                string defiUUID = null;

                foreach (DataRow r in dtDefOnline.Rows)
                {
                    // ======================================
                    // 1️⃣ CON UUID → prioridad absoluta
                    // ======================================
                    if (!string.IsNullOrWhiteSpace(def.DefiCol3))
                    {
                        if (r["DEFI_Col3"] != DBNull.Value &&
                            r["DEFI_Col3"].ToString() == def.DefiCol3)
                        {
                            defiInterno = Convert.ToInt32(r["DEFI_Interno"]);
                            defiUUID = r["DEFI_Col3"].ToString();
                            break;
                        }
                    }
                    else
                    {
                        int tipiOnline = Convert.ToInt32(r["TIPI_Interno"]);

                        // ======================================
                        // 2️⃣ SIN UUID
                        // ======================================

                        // 🔹 TIPI ≠ 60 → comparación básica
                        if (tipiOnline != 60)
                        {
                            if (
                                r["DEFI_CodigoElemento"].ToString() == def.DefiCodigoElemento &&
                                r["DEFI_TipoElemento"].ToString() == def.DefiTipoElemento &&
                                tipiOnline == def.TipiInterno
                            )
                            {
                                defiInterno = Convert.ToInt32(r["DEFI_Interno"]);
                                defiUUID = r["DEFI_Col3"] == DBNull.Value
                                    ? null
                                    : r["DEFI_Col3"].ToString();
                                break;
                            }
                        }
                        // 🔹 TIPI = 60 → comparación COMPLETA
                        else
                        {
                            if (
                                r["DEFI_CodigoElemento"].ToString() == def.DefiCodigoElemento &&
                                r["DEFI_TipoElemento"].ToString() == def.DefiTipoElemento &&
                                tipiOnline == def.TipiInterno &&
                                (r["DEFI_NumSuministro"] == DBNull.Value ? null : r["DEFI_NumSuministro"].ToString()) == def.DefiNumSuministro &&
                                Nullable.Equals(
                                    r["DEFI_Latitud"] == DBNull.Value ? (double?)null : Convert.ToDouble(r["DEFI_Latitud"]),
                                    def.DefiLatitud
                                ) &&
                                Nullable.Equals(
                                    r["DEFI_Longitud"] == DBNull.Value ? (double?)null : Convert.ToDouble(r["DEFI_Longitud"]),
                                    def.DefiLongitud
                                ) &&
                                Nullable.Equals(
                                    r["DEFI_DistHorizontal"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["DEFI_DistHorizontal"]),
                                    def.DefiDistHorizontal
                                ) &&
                                Nullable.Equals(
                                    r["DEFI_DistVertical"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["DEFI_DistVertical"]),
                                    def.DefiDistVertical
                                ) &&
                                Nullable.Equals(
                                    r["DEFI_DistTransversal"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["DEFI_DistTransversal"]),
                                    def.DefiDistTransversal
                                ) &&
                                (r["DEFI_Observacion"] == DBNull.Value ? null : r["DEFI_Observacion"].ToString()) == def.DefiObservacion
                            )
                            {
                                defiInterno = Convert.ToInt32(r["DEFI_Interno"]);
                                defiUUID = r["DEFI_Col3"] == DBNull.Value
                                    ? null
                                    : r["DEFI_Col3"].ToString();
                                break;
                            }
                        }
                    }
                }

                // ======================================
                // ASIGNACIÓN FINAL
                // ======================================

                if (defiInterno > 0)
                {
                    def.DefiInterno = defiInterno;

                    // Si existe en DB pero no tenía UUID → usar el de DB
                    def.DefiCol3 = string.IsNullOrWhiteSpace(defiUUID)
                        ? def.DefiCol3
                        : defiUUID;
                }
                else
                {
                    def.DefiInterno = 0;

                    // Crear UUID si no existe
                    if (string.IsNullOrWhiteSpace(def.DefiCol3))
                        def.DefiCol3 = Guid.NewGuid().ToString().ToUpper();
                }
            }

            return deficienciasOffline;
        }

        public List<Archivo> DAOFF_ResolverArchivosInternoSimple(DataTable dtDefOnline, DataTable dtArchOnline, List<Archivo> archivosOffline )
        {
            foreach (var archivo in archivosOffline)
            {
                int codTabla = 0;
                int archInterno = 0;
                string defiUUID = null;

                // =================================================
                // 1️⃣ RESOLVER DEFICIENCIA (ArchCodTabla + DefiUUID)
                // =================================================

                // 🔹 Prioridad: DEFI_UUID
                if (!string.IsNullOrWhiteSpace(archivo.DefiUuid))
                {
                    foreach (DataRow r in dtDefOnline.Rows)
                    {
                        if (r["DEFI_Col3"] != DBNull.Value &&
                            r["DEFI_Col3"].ToString() == archivo.DefiUuid)
                        {
                            codTabla = Convert.ToInt32(r["DEFI_Interno"]);
                            defiUUID = r["DEFI_Col3"].ToString();
                            break;
                        }
                    }
                }
                else
                {
                    // 🔹 Sin UUID → buscar por clave compuesta
                    foreach (DataRow r in dtDefOnline.Rows)
                    {
                        if (
                            Convert.ToInt32(r["DEFI_IdElemento"]) == archivo.ArchIdElemento &&
                            r["DEFI_TipoElemento"].ToString() == archivo.ArchTipoElemento &&
                            Convert.ToInt32(r["TIPI_Interno"]) == archivo.TipiInterno
                        )
                        {
                            codTabla = Convert.ToInt32(r["DEFI_Interno"]);
                            defiUUID = r["DEFI_Col3"] == DBNull.Value
                                ? null
                                : r["DEFI_Col3"].ToString();
                            break;
                        }
                    }
                }

                // Setear Deficiencia
                archivo.ArchCodTabla = codTabla;
                archivo.DefiUuid = defiUUID;

                // =================================================
                // 2️⃣ VERIFICAR SI EL ARCHIVO EXISTE
                // =================================================

                foreach (DataRow r in dtArchOnline.Rows)
                {
                    if (r["ARCH_Nombre"].ToString() == archivo.ArchNombre)
                    {
                        archInterno = Convert.ToInt32(r["ARCH_Interno"]);
                        break;
                    }
                }

                // Setear Archivo
                archivo.ArchInterno = archInterno;
            }

            return archivosOffline;
        }
    }

    // Extensiones para lectura nullable usando nombres de columna
    public static class SqliteDataReaderExtensions
    {
        public static int? GetNullableInt32(this SqliteDataReader r, string col)
            => r.IsDBNull(r.GetOrdinal(col)) ? (int?)null : r.GetInt32(r.GetOrdinal(col));

        public static double? GetNullableDouble(this SqliteDataReader r, string col)
            => r.IsDBNull(r.GetOrdinal(col)) ? (double?)null : r.GetDouble(r.GetOrdinal(col));

        public static decimal? GetNullableDecimal(this SqliteDataReader r, string col)
            => r.IsDBNull(r.GetOrdinal(col)) ? (decimal?)null : r.GetDecimal(r.GetOrdinal(col));

        public static string? GetNullableString(this SqliteDataReader r, string col)
            => r.IsDBNull(r.GetOrdinal(col)) ? null : r.GetString(r.GetOrdinal(col));

        public static DateTime? GetNullableDateTime(this SqliteDataReader r, string col)
            => r.IsDBNull(r.GetOrdinal(col)) ? (DateTime?)null : DateTime.Parse(r.GetString(r.GetOrdinal(col)));

        public static bool? GetNullableBool(this SqliteDataReader r, string col)
            => r.IsDBNull(r.GetOrdinal(col)) ? (bool?)null : r.GetInt32(r.GetOrdinal(col)) == 1;
    }
}
