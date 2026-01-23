using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Sigre.Entities.Entities.SyncData;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAOffline
    {
        public async Task<List<DeficienciaSyncDto>> LeerDeficienciasDesdeSqliteAsync(IFormFile file)
        {
            var deficiencias = new List<DeficienciaSyncDto>();

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

            return deficiencias;
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
