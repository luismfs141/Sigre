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

        public List<(int localId, int serverId)> DAARCH_SyncFromSQLite(
    List<ArchivoSyncDto> archivosOffline)
        {
            using var ctx = new SigreContext();
            var resultado = new List<(int, int)>();

            DADeficiency daDef = new DADeficiency();

            foreach (var dto in archivosOffline)
            {
                // 🔹 Resolver Deficiencia padre
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

                dto.ArchCodTabla = idDeficiency;

                // 🔍 Buscar archivo existente (UUID recomendado)
                var existente = ctx.Archivos
                    .FirstOrDefault(a => a.ArchNombre == dto.ArchNombre);

                if (existente != null)
                {
                    // 🔁 UPDATE
       
                    existente.ArchLongitud = dto.ArchLongitud;
                    existente.ArchLatitud = dto.ArchLatitud;
                    existente.ArchActivo = dto.ArchActivo;
                    existente.ArchFecha = dto.ArchFecha;

                    resultado.Add((dto.ArchInterno, existente.ArchInterno));
                }
                else
                {
                    // ➕ INSERT
                    var archivo = DAARCH_ConvertFile(dto);
                    ctx.Archivos.Add(archivo);

                    ctx.SaveChanges(); // necesario para obtener ID

                    resultado.Add((dto.ArchInterno, archivo.ArchInterno));
                }
            }

            return resultado;
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
