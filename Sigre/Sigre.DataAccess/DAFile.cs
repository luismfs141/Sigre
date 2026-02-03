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
                var archivo = ctx.Archivos.SingleOrDefault(x => x.ArchInterno == idArchivo);
                if (archivo != null)
                {
                    archivo.ArchActivo = false; // O 0, dependiendo de tu tipo de dato en BD
                    ctx.SaveChanges();
                    return true;
                }
                return false;
            }
        }
        public void DAARCH_SaveInWeb(Archivo x_archivo)
        {
            using (SigreContext ctx = new SigreContext())
            {
                // 🔍 LÓGICA DE INSERCIÓN vs ACTUALIZACIÓN
                if (x_archivo.ArchInterno == 0)
                {
                    // === CASO 1: ES NUEVO (INSERT) ===
                    // Al agregar sin ID, la BD generará el correlativo automático.
                    ctx.Archivos.Add(x_archivo);
                }
                else
                {
                    // === CASO 2: YA EXISTE (UPDATE) ===
                    var original = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == x_archivo.ArchInterno);

                    if (original != null)
                    {
                        // Actualizamos solo los datos relevantes que vienen de la Web
                        original.ArchNombre = x_archivo.ArchNombre;
                        original.ArchTipo = x_archivo.ArchTipo;
                        original.ArchActivo = x_archivo.ArchActivo;

                        // Actualizamos metadatos si vienen con valor
                        if (x_archivo.ArchFecha > DateTime.MinValue)
                            original.ArchFecha = x_archivo.ArchFecha;

                        original.ArchLatitud = x_archivo.ArchLatitud;
                        original.ArchLongitud = x_archivo.ArchLongitud;

                        // Nota: No tocamos IDs de tablas foráneas (ArchCodTabla) para evitar romper relaciones por error
                    }
                }

                ctx.SaveChanges();
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
            return new Archivo
            {
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
    }
}
