using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
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
    }
}
