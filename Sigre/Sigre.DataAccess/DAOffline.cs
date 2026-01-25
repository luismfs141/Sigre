using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.SyncData;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAOffline
    {
        public async Task<List<DeficienciaSyncDto>> DAOFF_LeerDeficienciasDesdeSqlite(IFormFile file)
        {
            var deficiencias = new List<DeficienciaSyncDto>();
            var tempFile = Path.GetTempFileName();

            try
            {
                // Guardar archivo temporal
                using (var stream = File.Create(tempFile))
                {
                    file.CopyTo(stream);
                }

                using (var connection = new SqliteConnection($"Data Source={tempFile}"))
                {
                    connection.Open();

                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = "SELECT * FROM Deficiencias";

                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
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
                                    EstadoOffLine = reader.GetNullableInt32("EstadoOffLine") ?? 0,
                                    DefiServerId = reader.GetNullableInt32("DefiServerId")
                                };

                                deficiencias.Add(def);
                            }
                        }
                    }
                }
            }
            finally
            {
                try
                {
                    if (File.Exists(tempFile))
                        File.Delete(tempFile);
                }
                catch (IOException)
                {
                    // ignorar
                }
            }

            return deficiencias;
        }


        public async Task<List<ArchivoSyncDto>> DAOFF_LeerArchivosDesdeSqliteAsync(IFormFile file)
        {
            var archivos = new List<ArchivoSyncDto>();

            // Guardar temporalmente el archivo SQLite
            var tempFile = Path.GetTempFileName();
            try
            {
                using (var stream = File.Create(tempFile))
                {
                    await file.CopyToAsync(stream);
                }

                using (var connection = new SqliteConnection($"Data Source={tempFile}"))
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
                                    DefiServerId = reader.GetNullableInt32("DefiServerId") ?? 0, // ✅ usar la que existe
                                };
                                archivos.Add(archivo);
                            }
                        }
                    }
                }
            }
            finally
            {
                // Borrar archivo temporal de manera segura
                try
                {
                    if (File.Exists(tempFile))
                        File.Delete(tempFile);
                }
                catch (IOException)
                {
                    // Ignorar si el archivo está en uso
                }
            }
            return archivos;
        }

        public async Task<(int deficiencias, int archivos)> DAOFF_SyncDataOffline(IFormFile file)
        {
            int defCount = 0;
            int archCount = 0;

            var deficiencias_off = (await DAOFF_LeerDeficienciasDesdeSqlite(file))
                                    .Where(d => d.EstadoOffLine != 0)
                                    .ToList();

            var archivos_off = (await DAOFF_LeerArchivosDesdeSqliteAsync(file))
                                .Where(a => a.EstadoOffLine != 0)
                                .ToList();

            // 🔹 Deficiencias        
            if (deficiencias_off.Count() > 0)
            {
                var dADeficiency = new DADeficiency();
                foreach (var def_off in deficiencias_off)
                {
                    int idDeficiencia = dADeficiency.DADEFI_ExistDeficiency(
                        def_off.DefiCodigoElemento,
                        def_off.DefiTipoElemento,
                        def_off.TipiInterno ?? 0
                    );

                    def_off.DefiInterno = idDeficiencia;

                    var deficiencia = dADeficiency.DADEFI_ConvertDeficiency(def_off);
                    dADeficiency.DADEFI_Save(deficiencia);

                    defCount++;
                }
            }

            // 🔹 Archivos
            if (archivos_off.Count() > 0)
            {
                var dAFile = new DAFile();
                foreach (var arch_off in archivos_off)
                {
                    int idArchivo = dAFile.ARCH_ExistPhoto(arch_off.ArchNombre);

                    arch_off.ArchInterno = idArchivo;

                    var archivo = dAFile.ARCH_ConvertFile(arch_off);
                    dAFile.DAARCH_Save(archivo);

                    archCount++;
                }
            }

            return (defCount, archCount);
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
