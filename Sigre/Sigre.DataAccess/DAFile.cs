using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.SyncData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAFile
    {
        public void DAARCH_Save(Archivo x_archivo)
        {
            SigreContext ctx = new SigreContext();

            if (x_archivo.ArchInterno== 0)
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

            var query =
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join p in ctx.Postes on df.DefiIdElemento equals p.PostInterno
                join s in ctx.Seds on p.PostSubestacion equals s.SedInterno
                where df.DefiTipoElemento == "POST"
                      && x_seds.Contains(s.SedInterno)
                select ar;

            return query.ToList();
        }

        public Archivo DAARCH_GetTableData()
        {
            SigreContext ctx = new SigreContext();

            Archivo archivoTabla = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == 1);
            return archivoTabla;
        }

        public List<(int localId, int serverId)> DAARCH_SyncFromSQLite(List<ArchivoSyncDto> archivosOffline)
        {
            using var ctx = new SigreContext();
            var resultado = new List<(int, int)>();

            foreach (var dto in archivosOffline)
            {
                // ===============================
                // 🔹 INSERT (nuevo desde SQLite)
                // ===============================
                if (dto.EstadoOffLine == 2)
                {
                    var nuevo = new Archivo
                    {
                        ArchInterno = 0, // EF genera
                        ArchTipo = dto.ArchTipo,
                        ArchTabla = dto.ArchTabla ?? "Deficiencias",

                        // 🔑 RELACIÓN CORRECTA
                        ArchCodTabla = (int)dto.ArchCodTabla,

                        ArchNombre = dto.ArchNombre,
                        ArchLatitud = dto.ArchLatitud,
                        ArchLongitud = dto.ArchLongitud,
                        ArchFecha = dto.ArchFecha,

                        ArchTipoElemento = dto.ArchTipoElemento,
                        ArchIdElemento = dto.ArchIdElemento,
                        TipiInterno = dto.TipiInterno,

                        ArchActivo = dto.ArchActivo == true
                    };

                    ctx.Archivos.Add(nuevo);
                    ctx.SaveChanges();

                    resultado.Add((dto.ArchInterno, nuevo.ArchInterno));
                }

                // ===============================
                // 🔹 UPDATE
                // ===============================
                else if (dto.EstadoOffLine == 1)
                {
                    var existente = ctx.Archivos
                        .FirstOrDefault(a => a.ArchInterno == dto.DefiServerId.Value);

                    if (existente == null) continue;

                    existente.ArchTipo = dto.ArchTipo;
                    existente.ArchNombre = dto.ArchNombre;
                    existente.ArchLatitud = dto.ArchLatitud;
                    existente.ArchLongitud = dto.ArchLongitud;
                    existente.ArchFecha = dto.ArchFecha;
                    existente.ArchTipoElemento = dto.ArchTipoElemento;
                    existente.ArchIdElemento = dto.ArchIdElemento;
                    existente.TipiInterno = dto.TipiInterno;
                    existente.ArchActivo = dto.ArchActivo == true;

                    ctx.SaveChanges();

                    resultado.Add((dto.ArchInterno, existente.ArchInterno));
                }

                //// ===============================
                //// 🔹 DELETE LÓGICO
                //// ===============================
                //else if (dto.EstadoOffLine == 3)
                //{
                //    var existente = ctx.Archivos
                //        .FirstOrDefault(a => a.ArchInterno == dto.DefiServerId.Value);

                //    if (existente == null) continue;

                //    existente.ArchActivo = false;
                //    ctx.SaveChanges();

                //    resultado.Add((dto.ArchInterno, existente.ArchInterno));
                //}



                // ===============================
                // 🔹 DELETE LÓGICO
                // ===============================
                else if (dto.EstadoOffLine == 3)
                {
                    if (!dto.DefiServerId.HasValue) continue;

                    var existente = ctx.Archivos
                        .FirstOrDefault(a => a.ArchInterno == dto.DefiServerId.Value);

                    if (existente == null) continue;

                    // ✅ IMPORTANTE: actualizar la ruta también
                    if (!string.IsNullOrWhiteSpace(dto.ArchNombre))
                        existente.ArchNombre = dto.ArchNombre;

                    existente.ArchActivo = false;

                    ctx.SaveChanges();

                    resultado.Add((dto.ArchInterno, existente.ArchInterno));
                }
            }

            return resultado;
        }


    }
}
