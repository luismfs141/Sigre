using Microsoft.EntityFrameworkCore;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.SyncData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace Sigre.DataAccess
{
    public class DAFile
    {
        public void DAARCH_Save(Archivo x_archivo)
        {
            SigreContext ctx = new SigreContext();

            if (x_archivo.ArchInterno == 0)
            {
                ctx.Archivos.Add(x_archivo);
            }
            else
            {
                var original = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == x_archivo.ArchInterno);
                ctx.Entry(original).CurrentValues.SetValues(x_archivo);
            }
            ctx.SaveChanges();
        }

        public List<Archivo> DAARCH_GetByDeficiency(int x_deficiency)
        {
            SigreContext ctx = new SigreContext();

            var files =
                (from a in ctx.Archivos
                 where a.ArchCodTabla == x_deficiency
                 select a).ToList();

            return files;
        }
        public List<Archivo> DAARCH_GetByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();

            var query = (
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join amt in ctx.Alimentadores on df.DefiCodAmt equals amt.AlimCodigo
                where amt.AlimInterno == x_feeder_id
                select ar
                );

            return query.ToList();
        }

        public List<Archivo> DAARCH_GetByFeeders(List<int> x_feeders)
        {
            using var ctx = new SigreContext();

            var query = from ar in ctx.Archivos
                        join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                        join amt in ctx.Alimentadores on df.DefiCodAmt equals amt.AlimCodigo
                        where x_feeders.Contains(amt.AlimInterno)
                        select ar;

            return query.ToList();
        }

        public List<Archivo> DAARCH_GetBySeds(List<int> x_seds)
        {
            using var ctx = new SigreContext();

            var archPostes =
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join p in ctx.Postes on df.DefiIdElemento equals p.PostInterno
                join s in ctx.Seds on p.PostSubestacion equals s.SedInterno
                where df.DefiTipoElemento == "POST"
                      && x_seds.Contains(s.SedInterno)
                select ar;

            var archVanos =
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join v in ctx.Vanos on df.DefiIdElemento equals v.VanoInterno
                join s in ctx.Seds on v.VanoSubestacion equals s.SedInterno
                where df.DefiTipoElemento == "VANO"
                      && x_seds.Contains(s.SedInterno)
                select ar;

            return archPostes
                   .Union(archVanos)
                   .Distinct()
                   .ToList();
        }


        public Archivo DAARCH_GetTableData()
        {
            SigreContext ctx = new SigreContext();

            Archivo archivoTabla = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == 1);
            return archivoTabla;
        }

        //    public List<(int localId, int serverId)> DAARCH_SyncFromSQLite(
        //List<ArchivoSyncDto> archivosOffline)
        //    {
        //        using var ctx = new SigreContext();
        //        var resultado = new List<(int, int)>();

        //        DADeficiency daDef = new DADeficiency();

        //        foreach (var dto in archivosOffline)
        //        {
        //            // 🔹 Resolver Deficiencia padre
        //            int idDeficiency;

        //            if (!string.IsNullOrWhiteSpace(dto.DefiUUID))
        //            {
        //                idDeficiency = daDef.DADEFI_GetDeficiencyIDByUUID(dto.DefiUUID);
        //            }
        //            else
        //            {
        //                idDeficiency = daDef.DADEFI_GetDeficiencyIDByElementAndType(
        //                    dto.ArchIdElemento ?? 0,
        //                    dto.ArchTipoElemento ?? string.Empty,
        //                    dto.TipiInterno ?? 0
        //                );
        //            }

        //            dto.ArchCodTabla = idDeficiency;

        //            // 🔍 Buscar archivo existente (UUID recomendado)
        //            var existente = ctx.Archivos
        //                .FirstOrDefault(a => a.ArchNombre == dto.ArchNombre);

        //            if (existente != null)
        //            {
        //                // 🔁 UPDATE

        //                existente.ArchLongitud = dto.ArchLongitud;
        //                existente.ArchLatitud = dto.ArchLatitud;
        //                existente.ArchActivo = dto.ArchActivo;
        //                existente.ArchFecha = dto.ArchFecha;

        //                resultado.Add((dto.ArchInterno, existente.ArchInterno));
        //            }
        //            else
        //            {
        //                // ➕ INSERT
        //                var archivo = DAARCH_ConvertFile(dto);
        //                ctx.Archivos.Add(archivo);

        //                ctx.SaveChanges(); // necesario para obtener ID

        //                resultado.Add((dto.ArchInterno, archivo.ArchInterno));
        //            }
        //        }

        //        return resultado;
        //    }

        public List<(int localId, int serverId)> DAARCH_SyncFromSQLite(List<ArchivoSyncDto> archivosOffline)
        {
            using var ctx = new SigreContext();
            var resultado = new List<(int, int)>();

            var daDef = new DADeficiency();

            foreach (var dto in archivosOffline)
            {
                // =========================
                // 1) Resolver Deficiencia padre (ID SERVER)
                // =========================
                int idDeficiency;

                if (!string.IsNullOrWhiteSpace(dto.DefiUUID))
                {
                    idDeficiency = daDef.DADEFI_GetDeficiencyIDByUUID(dto.DefiUUID);
                }
                else
                {
                    idDeficiency = daDef.DADEFI_GetDeficiencyIDByElementAndType(
                        dto.ArchIdElemento ?? 0,
                        dto.ArchTipoElemento ?? string.Empty,
                        dto.TipiInterno ?? 0
                    );
                }

                // Si no se pudo resolver la deficiencia, no sincronizamos este archivo
                if (idDeficiency <= 0)
                    continue;

                // Guardamos en el DTO si quieres mantener consistencia (aunque sea int? en el dto)
                dto.ArchCodTabla = idDeficiency;

                // =========================
                // 2) Normalizar ruta para comparar sin raíz (SIGRE.MOVIL / ELIMINADOS)
                // =========================
                var key = NormalizarRutaSinRaiz(dto.ArchNombre);

                // =========================
                // 3) Buscar existente:
                //    - SIEMPRE dentro de la misma deficiencia (idDeficiency)
                //    - Match por nombre exacto O por EndsWith(key)
                // =========================
                var existente = ctx.Archivos
                    .Where(a => a.ArchCodTabla == idDeficiency && a.ArchNombre != null)
                    .Where(a =>
                        a.ArchNombre == dto.ArchNombre
                        || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith(key))
                        || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith("/" + key))
                        || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith("\\" + key))
                    )
                    .OrderByDescending(a => a.ArchInterno) // por si hay duplicados antiguos, toma el último
                    .FirstOrDefault();

                if (existente != null)
                {
                    // =========================
                    // 4) UPDATE (no duplica aunque cambie raíz)
                    // =========================
                    existente.ArchCodTabla = idDeficiency;      // ✅ int -> int (evita CS0266)
                    existente.ArchNombre = dto.ArchNombre;    // ✅ guarda la ruta NUEVA (SIGRE.MOVIL / ELIMINADOS / etc.)
                    existente.ArchLongitud = dto.ArchLongitud;
                    existente.ArchLatitud = dto.ArchLatitud;
                    existente.ArchActivo = dto.ArchActivo;    // ✅ aquí cae tu ArchActivo=0
                    existente.ArchFecha = dto.ArchFecha;

                    ctx.SaveChanges();

                    resultado.Add((dto.ArchInterno, existente.ArchInterno));
                }
                else
                {
                    // =========================
                    // 5) INSERT
                    // =========================
                    // Asegura que el convert use el idDeficiency ya resuelto
                    dto.ArchCodTabla = idDeficiency;

                    var archivo = DAARCH_ConvertFile(dto);
                    ctx.Archivos.Add(archivo);

                    ctx.SaveChanges(); // para obtener ID

                    resultado.Add((dto.ArchInterno, archivo.ArchInterno));
                }
            }

            return resultado;
        }

        /// <summary>
        /// Quita prefijos variables (SIGRE.MOVIL/, ELIMINADOS/) y deja solo el "subpath" estable.
        /// Ej:
        ///   "SIGRE.MOVIL/sub/elem/foto.jpg" => "sub/elem/foto.jpg"
        ///   "ELIMINADOS/sub/elem/foto.jpg"  => "sub/elem/foto.jpg"
        /// </summary>
        private static string NormalizarRutaSinRaiz(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return string.Empty;

            path = path.Replace("\\", "/").Trim();

            while (path.StartsWith("/"))
                path = path.Substring(1);

            const string p1 = "SIGRE.MOVIL/";
            const string p2 = "ELIMINADOS/";

            if (path.StartsWith(p1, StringComparison.OrdinalIgnoreCase))
                return path.Substring(p1.Length);

            if (path.StartsWith(p2, StringComparison.OrdinalIgnoreCase))
                return path.Substring(p2.Length);

            // fallback: quita primer segmento "RAIZ/"
            int idx = path.IndexOf('/');
            if (idx >= 0 && idx < path.Length - 1)
                return path.Substring(idx + 1);

            return path;
        }



        // MÉTODO 1: ELIMINADO LÓGICO (Soft Delete)
        public bool DAFILE_SoftDelete(int idArchivo)
        {
            using (SigreContext ctx = new SigreContext())
            {
                try
                {
                    // === SQL DIRECTO (Bypass Entity Framework) ===
                    // Usamos UPDATE directo para no pasar por el modelo que busca DEFI_UUID.
                    // Asumimos que la columna en BD es 'ARCH_Activo' y la llave 'ARCH_Interno' 
                    // (basado en tus errores anteriores).

                    string sql = "UPDATE Archivos SET ARCH_Activo = 0 WHERE ARCH_Interno = {0}";

                    int filasAfectadas = ctx.Database.ExecuteSqlRaw(sql, idArchivo);

                    // Si afectó al menos 1 fila, es true
                    return filasAfectadas > 0;
                }
                catch (Exception)
                {
                    return false;
                }
            }
        }
        public void DAARCH_SaveInWeb(Archivo x_archivo)
        {
            using (SigreContext ctx = new SigreContext())
            {
                if (x_archivo.ArchInterno == 0)
                {
                    // === INSERTAR A LA FUERZA (BYPASS EF) ===
                    // Usamos SQL directo para evitar que EF intente buscar columnas que no existen (DEFI_UUID)
                    string sql = @"
               INSERT INTO Archivos 
                (
                    ARCH_Nombre, 
                    ARCH_Tipo, 
                    ARCH_Tabla, 
                    ARCH_CodTabla, 
                    ARCH_Latitud, 
                    ARCH_Longitud, 
                    ARCH_Fecha, 
                    ARCH_TipoElemento, 
                    ARCH_IdElemento, 
                    TIPI_Interno, 
                    ARCH_Activo
                ) 
                VALUES 
                ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10})";

                    ctx.Database.ExecuteSqlRaw(sql,
                        x_archivo.ArchNombre ?? (object)DBNull.Value,
                        x_archivo.ArchTipo ?? (object)DBNull.Value,
                        "Deficiencias", // ArchTabla hardcodeado como en tu lógica
                        x_archivo.ArchCodTabla,
                        x_archivo.ArchLatitud,
                        x_archivo.ArchLongitud,
                        x_archivo.ArchFecha,
                        x_archivo.ArchTipoElemento ?? (object)DBNull.Value,
                        x_archivo.ArchIdElemento ?? (object)DBNull.Value,
                        x_archivo.TipiInterno ?? (object)DBNull.Value,
                        (x_archivo.ArchActivo == true) ? 1 : 0
                    );
                }
                else
                {
                    // === UPDATE (Este suele fallar menos, pero si falla, avísame) ===
                    var original = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == x_archivo.ArchInterno);
                    if (original != null)
                    {
                        original.ArchNombre = x_archivo.ArchNombre;
                        original.ArchTipo = x_archivo.ArchTipo;
                        original.ArchActivo = x_archivo.ArchActivo;
                        if (x_archivo.ArchFecha > DateTime.MinValue) original.ArchFecha = x_archivo.ArchFecha;
                        original.ArchLatitud = x_archivo.ArchLatitud;
                        original.ArchLongitud = x_archivo.ArchLongitud;

                        ctx.SaveChanges();
                    }
                }
            }
        }
        public int ARCH_ExistPhoto(string ruta)
        {
            SigreContext ctx = new SigreContext();

            Archivo archivo = ctx.Archivos.SingleOrDefault(a => a.ArchNombre == ruta);

            if ((archivo is not null))
            {
                return archivo.ArchInterno;
            }
            else
            {
                return 0;
            }
        }
        public Archivo ARCH_ConvertFile(ArchivoSyncDto arch_offline)
        {
            return new Archivo
            {
                // 🔑 Identificadores
                ArchInterno = arch_offline.ArchInterno,

                // 📁 Información del archivo
                ArchTipo = arch_offline.ArchTipo,
                ArchTabla = arch_offline.ArchTabla,
                ArchCodTabla = (int)arch_offline.ArchCodTabla,
                ArchNombre = arch_offline.ArchNombre,

                // 📍 Ubicación
                ArchLatitud = arch_offline.ArchLatitud,
                ArchLongitud = arch_offline.ArchLongitud,

                // 📅 Fecha
                ArchFecha = arch_offline.ArchFecha,

                // 🔗 Relación con elemento
                ArchTipoElemento = arch_offline.ArchTipoElemento,
                ArchIdElemento = arch_offline.ArchIdElemento,
                TipiInterno = arch_offline.TipiInterno,

                // ⚙️ Estado
                ArchActivo = arch_offline.ArchActivo,
            };
        }
        public void DADEFI_UpdateCodTablaByDeficiency(
            SigreContext ctx,
            Deficiencia deficiencia
        )
        {
            if (deficiencia == null)
                return;

            var archivos = ctx.Archivos
                .Where(a =>
                    a.ArchTabla == "Deficiencias" &&
                    a.ArchIdElemento == deficiencia.DefiIdElemento &&
                    a.ArchTipoElemento == deficiencia.DefiTipoElemento &&
                    a.TipiInterno == deficiencia.TipiInterno &&
                    a.ArchCodTabla != deficiencia.DefiInterno
                )
                .ToList();

            foreach (var archivo in archivos)
            {
                archivo.ArchCodTabla = deficiencia.DefiInterno;
            }
        }
        public void DADEFI_UpdateCodTablaBySed(string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo))
                return;

            var dASed = new DASed();
            var sed = dASed.DASed_GetByCodigo(codigo);
            if (sed == null)
                return;

            using var ctx = new SigreContext();

            var idPostes = ctx.Postes
                .Where(p => p.PostSubestacion == sed.SedInterno)
                .Select(p => p.PostInterno)
                .ToList();

            var idVanos = ctx.Vanos
                .Where(v => v.VanoSubestacion == sed.SedInterno)
                .Select(v => v.VanoInterno)
                .ToList();

            var deficiencias = ctx.Deficiencias
                .Where(d =>
                    (d.DefiTipoElemento == "POST" &&
                     d.DefiIdElemento != null &&
                     idPostes.Contains((int)d.DefiIdElemento)) ||
                    (d.DefiTipoElemento == "VANO" &&
                     d.DefiIdElemento != null &&
                     idVanos.Contains((int)d.DefiIdElemento))
                )
                .ToList();

            if (!deficiencias.Any())
                return;

            using var tx = ctx.Database.BeginTransaction();

            try
            {
                foreach (var def in deficiencias)
                {
                    DADEFI_UpdateCodTablaByDeficiency(ctx, def);
                }

                ctx.SaveChanges();
                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public Archivo DAARCH_ConvertFile(ArchivoSyncDto arch_offline)
        {
            string defiUuid = null;
            if (!string.IsNullOrWhiteSpace(arch_offline.DefiUUID))
            {
                defiUuid = arch_offline.DefiUUID.Trim();
                if (defiUuid.Length > 50) defiUuid = defiUuid.Substring(0, 50);
            }

            return new Archivo
            {
                ArchTipo = arch_offline.ArchTipo,
                ArchTabla = arch_offline.ArchTabla,
                ArchCodTabla = (int)arch_offline.ArchCodTabla,
                ArchNombre = arch_offline.ArchNombre,

                ArchLatitud = arch_offline.ArchLatitud,
                ArchLongitud = arch_offline.ArchLongitud,

                ArchFecha = arch_offline.ArchFecha,

                ArchTipoElemento = arch_offline.ArchTipoElemento,
                ArchIdElemento = arch_offline.ArchIdElemento,
                TipiInterno = arch_offline.TipiInterno,

                ArchActivo = arch_offline.ArchActivo,

                // ✅ INSERT también guarda DEFI_UUID
                DefiUUID = defiUuid
            };
        }
        public List<Archivo> DAARCH_GetByDeficiencyWeb(int x_deficiency)
        {
            using (var ctx = new SigreContext())
            {
                // TRUCO: En lugar de 'select a' (que trae todo, incluso errores),
                // creamos un nuevo objeto Archivo y llenamos SOLO lo que existe.
                var query = ctx.Archivos
                    .Where(a => a.ArchCodTabla == x_deficiency)
                    .Select(a => new Archivo
                    {
                        // Copia aquí las propiedades tal cual se llaman en tu clase
                        ArchInterno = a.ArchInterno,
                        ArchNombre = a.ArchNombre,
                        ArchTipo = a.ArchTipo,
                        ArchFecha = a.ArchFecha,
                        ArchIdElemento = a.ArchIdElemento,
                        // Asegúrate de incluir estas coordenadas y datos clave
                        ArchLatitud = a.ArchLatitud,
                        ArchLongitud = a.ArchLongitud,

                        ArchCodTabla = a.ArchCodTabla,
                        ArchTabla = a.ArchTabla,
                        ArchActivo = a.ArchActivo,

                        // IMPORTANTE: NO incluyas 'Deficiencia' aquí.
                        // Al no ponerlo, EF no intenta buscar el UUID.
                    });

                return query.ToList();
            }
        }
    }
}
