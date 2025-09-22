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
    }
}
