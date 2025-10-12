using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DASed
    {
        public List<PinStruct> DASed_PinByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();
            var query = ctx.Seds.Where(v => v.AlimInterno == x_feeder_id).Select(s => new PinStruct() {
                Id = s.SedInterno,
                Label = s.SedEtiqueta,
                IdAlimentador = s.AlimInterno,
                Latitude = s.SedLatitud,
                Longitude = s.SedLongitud,
                ElementCode = s.SedCodigo,
                Inspeccionado = s.SedInspeccionado,
                TipoMaterial = s.SedMaterial == null?"CON":s.SedMaterial.ToString(),
                Tercero = s.SedTerceros,
                Selected = false,
                Type = 
                    s.SedTipo == "M" ? ElectricElement.SedMP :
                    s.SedTipo == "B" ? ElectricElement.SedBP :
                    s.SedTipo == "C" ? ElectricElement.SedCA :
                    s.SedTipo == "P" ? ElectricElement.SedPV :
                    s.SedTipo == "S" ? ElectricElement.SedST : ElectricElement.Unknown
            });
            return query.ToList();
        }

        public List<Sed> DASed_GetByListFeeder(int? feeder1, int? feeder2, int? feeder3)
        {
            using var ctx = new SigreContext();

            var feederList = new List<int>();
            if (feeder1.HasValue) feederList.Add(feeder1.Value);
            if (feeder2.HasValue) feederList.Add(feeder2.Value);
            if (feeder3.HasValue) feederList.Add(feeder3.Value);

            var seds = ctx.Seds
                          .Where(s => feederList.Contains(s.AlimInterno))
                          .ToList();

            return seds;
        }

        public List<ElementStruct> DASed_GetStructByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();

            var seds = ctx.ElementStructs.FromSqlRaw("exec sp_GetSedsByFeeder @Feeder",
                new SqlParameter("@Feeder", x_feeder_id)
                ).ToList();

            return seds;
        }
    }
}
