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
        public List<PinStruct> DASed_PinsByFeeders(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();
            var query = ctx.Seds.Where(s => x_feeders.Contains(s.AlimInterno)).Select(s => new PinStruct() {
                Id = s.SedInterno,
                Label = s.SedEtiqueta,
                IdAlimentador = s.AlimInterno,
                Latitude = s.SedLatitud,
                Longitude = s.SedLongitud,
                ElementCode = s.SedCodigo,
                Inspeccionado = s.SedInspeccionado,
                Tercero = s.SedTerceros,
                Type = 
                    s.SedTipo == "M" ? ElectricElement.SedMP :
                    s.SedTipo == "B" ? ElectricElement.SedBP :
                    s.SedTipo == "C" ? ElectricElement.SedCA :
                    s.SedTipo == "P" ? ElectricElement.SedPV :
                    s.SedTipo == "S" ? ElectricElement.SedST : ElectricElement.Unknown
            });
            return query.ToList();
        }

        public List<PinStruct> DASed_PinsBySeds(List<int> x_seds)
        {
            SigreContext ctx = new SigreContext();
            var query = ctx.Seds.Where(s => x_seds.Contains(s.SedInterno)).Select(s => new PinStruct()
            {
                Id = s.SedInterno,
                Label = s.SedEtiqueta,
                IdAlimentador = s.AlimInterno,
                Latitude = s.SedLatitud,
                Longitude = s.SedLongitud,
                ElementCode = s.SedCodigo,
                Inspeccionado = s.SedInspeccionado,
                Tercero = s.SedTerceros,
                Type =
                    s.SedTipo == "M" ? ElectricElement.SedMP :
                    s.SedTipo == "B" ? ElectricElement.SedBP :
                    s.SedTipo == "C" ? ElectricElement.SedCA :
                    s.SedTipo == "P" ? ElectricElement.SedPV :
                    s.SedTipo == "S" ? ElectricElement.SedST : ElectricElement.Unknown
            });
            return query.ToList();
        }

        //0 -> Baja Tension, 1 -> Media Tension
        public List<PinStruct> DASed_Pins(List<int> x_ids, int proyecto)
        {
            if (proyecto == 0)
                return DASed_PinsBySeds(x_ids);
            else
                return DASed_PinsByFeeders(x_ids);
        }

        public List<Sed> DASed_GetByListFeeder(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();

            var seds = ctx.Seds.Where(s => x_feeders.Contains(s.AlimInterno)).ToList();

            return seds;
        }

        public List<Sed> DASed_GetByListSeds(List<int> x_seds)
        {
            SigreContext ctx = new SigreContext();

            var seds = ctx.Seds.Where(s => x_seds.Contains(s.SedInterno)).ToList();

            return seds;
        }

        public List<Sed> DASed_GetByProject(List<int> x_ids, int proyecto)
        {
            if (proyecto == 0)
                return DASed_GetByListSeds(x_ids);
            else
                return DASed_GetByListFeeder(x_ids);
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
