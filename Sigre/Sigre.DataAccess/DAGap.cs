using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Sigre.DataAccess.Context;
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

        public List<Vano> DAGAP_GetByListFeeder(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();

            var vanos = ctx.Vanos.Where(v => x_feeders.Contains(v.AlimInterno)).ToList();

            return vanos;
        }

        public List<Vano> DAGAP_GetByListSeds(List<int> x_seds)
        {
            SigreContext ctx = new SigreContext();

            var vanos = ctx.Vanos.Where(v => x_seds.Contains((int)v.VanoSubestacion)).ToList();

            return vanos;
        }

        //0-> Baja Tension, 1 -> Media Tension
        public List<Vano> DAGAP_GetByProject(List<int> x_ids, int x_project)
        {
            if (x_project == 0)
                return DAGAP_GetByListSeds(x_ids);
            else
                return DAGAP_GetByListFeeder(x_ids);
        }



        public List<PinStruct> DAGAP_GetPinsByFeeders(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();

            List<PinStruct> pinVanos = ctx.Vanos.Where(v => x_feeders.Contains(v.AlimInterno)).Select(v => new PinStruct()
            {
                Id = v.VanoInterno,
                IdAlimentador = v.AlimInterno,
                Label = "",
                Type = ElectricElement.Gap,
                NodoInicial = v.VanoNodoInicial,
                NodoFinal = v.VanoNodoFinal,
                Inspeccionado = v.VanoInspeccionado
            }).ToList();

            return pinVanos;
        }

        public List<PinStruct> DAGAP_GetPinsBySubestacion(List<int> x_subestaciones)
        {
            using (var ctx = new SigreContext())
            {
                var pinVanos = ctx.Vanos
                    .Where(v => x_subestaciones.Contains((int)v.VanoSubestacion)) // suponiendo campo SubestacionInterna
                    .Select(v => new PinStruct()
                    {
                        Id = v.VanoInterno,
                        IdAlimentador = v.AlimInterno,
                        Label = "",
                        Type = ElectricElement.Gap,
                        NodoInicial = v.VanoNodoInicial,
                        NodoFinal = v.VanoNodoFinal,
                        Inspeccionado = v.VanoInspeccionado
                    }).ToList();

                return pinVanos;
            }
        }

        //0-> Baja Tension, 1 -> Media Tension
        public List<PinStruct> DAGAP_GetPins(List<int> x_ids, int proyecto)
        {
            if (proyecto == 0)
                return DAGAP_GetPinsBySubestacion(x_ids);
            else
                return DAGAP_GetPinsByFeeders(x_ids);
        }

    }
}
