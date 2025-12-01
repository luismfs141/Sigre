using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
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

        public List<PinStruct> DAEQUI_PinsByFeeders(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();
            var equi = ctx.Equipos.Where(e => x_feeders.Contains(e.AlimInterno)).Select(e =>
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

        public List<Equipo> DAEQUI_GetByListFeeder(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();

            var equipos = ctx.Equipos
                             .Where(e => x_feeders.Contains(e.AlimInterno))
                             .ToList();

            return equipos;
        }
        public List<Equipo> DAEQUI_GetByProject(List<int> x_ids, int x_project)
        {
            if (x_project == 0)
                return null;
            else
                return DAEQUI_GetByListFeeder(x_ids);
        }
    }
}
