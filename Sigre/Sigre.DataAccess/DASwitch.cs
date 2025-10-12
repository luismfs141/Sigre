using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DASwitch
    {

        public List<PinStruct> DAEQUI_PinByFeeder(int x_feeder_Id)
        {
            SigreContext ctx = new SigreContext();
            var equi = ctx.Equipos.Where(e => e.AlimInterno == x_feeder_Id).Select(e =>
                new PinStruct()
                {
                    Id = e.EquiInterno,
                    Label = e.EquiEtiqueta,
                    Latitude = e.EquiLatitud,
                    Longitude = e.EquiLongitud,
                    Type = ElectricElement.Swicth
                }
            );
            return equi.ToList();
        }

        public List<Equipo> DAEQUI_GetByListFeeder(int? feeder1, int? feeder2, int? feeder3)
        {
            using var ctx = new SigreContext();

            var feederList = new List<int>();
            if (feeder1.HasValue) feederList.Add(feeder1.Value);
            if (feeder2.HasValue) feederList.Add(feeder2.Value);
            if (feeder3.HasValue) feederList.Add(feeder3.Value);

            var equipos = ctx.Equipos
                             .Where(e => feederList.Contains(e.AlimInterno))
                             .ToList();

            return equipos;
        }
    }
}
