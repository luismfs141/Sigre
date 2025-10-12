using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAGap
    {
        public List<Vano> DAGAP_GetByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();
            var vanos = ctx.Vanos.Where(v => v.AlimInterno == x_feeder_id).Select(van =>
            new Vano()
            {
                AlimInterno = van.AlimInterno,
                AlimInternoNavigation = van.AlimInternoNavigation,
                VanoCodigo = van.VanoCodigo,
                VanoEtiqueta = van.VanoEtiqueta,
                VanoInspeccionado = van.VanoInspeccionado,
                VanoInterno = van.VanoInterno,
                VanoLatitudFin = van.VanoLatitudFin,
                VanoLatitudIni = van.VanoLatitudIni,
                VanoLongitudFin = van.VanoLongitudFin,
                VanoLongitudIni = van.VanoLongitudIni,
                VanoMaterial = van.VanoMaterial == null? "ALU" : van.VanoMaterial,
                VanoNodoFinal = van.VanoNodoFinal,
                VanoNodoInicial = van.VanoNodoInicial,
                VanoTerceros = van.VanoTerceros
            }
            );
            return vanos.ToList();
        }

        public List<ElementStruct> DAGap_GetStructByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();

            var gaps = ctx.ElementStructs.FromSqlRaw("exec sp_GetGapsByFeeder @Feeder",
                new SqlParameter("@Feeder", x_feeder_id)
                ).ToList();

            return gaps;
        }

        public List<Vano> DAGAP_GetByListFeeder(int? feeder1, int? feeder2, int? feeder3)
        {
            var result = new List<Vano>();

            if (feeder1.HasValue)
                result.AddRange(DAGAP_GetByFeeder(feeder1.Value));

            if (feeder2.HasValue)
                result.AddRange(DAGAP_GetByFeeder(feeder2.Value));

            if (feeder3.HasValue)
                result.AddRange(DAGAP_GetByFeeder(feeder3.Value));

            return result;
        }
    }
}
