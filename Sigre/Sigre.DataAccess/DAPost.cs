using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;


namespace Sigre.DataAccess
{
    public class DAPost
    {
        public List<PinStruct> DAPOST_PinsByFeeders(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();
            var posts = ctx.Postes.Where(p => x_feeders.Contains(p.AlimInterno)).Select(p => 
                new PinStruct()
                {
                    Id = p.PostInterno,
                    Label = p.PostEtiqueta,
                    Latitude = p.PostLatitud.Value,
                    Longitude = p.PostLongitud.Value,
                    Type = ElectricElement.Post,
                    ElementCode = p.PostCodigoNodo,
                    IdAlimentador = p.AlimInterno,
                    Inspeccionado = p.PostInspeccionado,
                    Tercero = p.PostTerceros
                }
            );
            return posts.ToList();
        }
        public List<Poste> DAPOST_GetByListFeeder(List<int> x_feeders)
        {
            using var ctx = new SigreContext();

            var postes = ctx.Postes.Where(p => x_feeders.Contains(p.AlimInterno)).ToList();

            return postes;
        }

        public List<Poste> DAPOST_GetByListSeds(List<int> x_seds)
        {
            using var ctx = new SigreContext();

            var postes = ctx.Postes.Where(p => x_seds.Contains((int)p.PostSubestacion)).ToList();

            return postes;
        }

        public List<Poste> DAPOST_GetByProject(List<int> x_ids, int x_project)
        {
            if (x_project == 0)
                return DAPOST_GetByListSeds(x_ids);
            else
                return DAPOST_GetByListFeeder(x_ids);
        }
        public List<ElementStruct> DAPOST_GetStructByFeeder(int x_feeder_id)
        {          
            SigreContext ctx = new SigreContext();

            var posts = ctx.ElementStructs.FromSqlRaw("exec sp_GetPostsByFeeder @Feeder",
                new SqlParameter("@Feeder",x_feeder_id)
                ).ToList();

            return posts;
        }

        public List<PinStruct> DAPOST_PinsBySubestacion(List<int> x_subestaciones)
        {
            using (var ctx = new SigreContext())
            {
                var posts = ctx.Postes
                    .Where(p => x_subestaciones.Contains((int)p.PostSubestacion)) // asumimos que hay SubestacionInterna
                    .Select(p => new PinStruct()
                    {
                        Id = p.PostInterno,
                        Label = p.PostEtiqueta,
                        Latitude = p.PostLatitud ?? 0,
                        Longitude = p.PostLongitud ?? 0,
                        Type = ElectricElement.Post,
                        ElementCode = p.PostCodigoNodo,
                        IdAlimentador = p.AlimInterno,
                        Inspeccionado = p.PostInspeccionado,
                        Tercero = p.PostTerceros
                    }).ToList();

                return posts;
            }
        }

        //0 -> Baja Tension, 1 -> Media Tension
        public List<PinStruct> DAPOST_Pins(List<int> x_ids, int proyecto)
        {
            if (proyecto == 0)
                return DAPOST_PinsBySubestacion(x_ids);
            else
                return DAPOST_PinsByFeeders(x_ids);
        }
    }
}
