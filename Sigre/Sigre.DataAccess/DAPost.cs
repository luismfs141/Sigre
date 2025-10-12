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
        public List<PinStruct> DAPOST_PinByFeeder(int x_feeder_Id)
        {
            SigreContext ctx = new SigreContext();
            var posts = ctx.Postes.Where(v => v.AlimInterno == x_feeder_Id).Select(p => 
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
                    Tercero = p.PostTerceros,
                    TipoMaterial = p.PostMaterial == null? "CON":p.PostMaterial.ToString(),
                    Selected =false
                }
            );
            return posts.ToList();
        }
        public List<Poste> DAPOST_GetByListFeeder(int? feeder1, int? feeder2, int? feeder3)
        {
            using var ctx = new SigreContext();

            // Construir lista solo con los feeders válidos (no nulos)
            var feederList = new List<int>();

            if (feeder1.HasValue) feederList.Add(feeder1.Value);
            if (feeder2.HasValue) feederList.Add(feeder2.Value);
            if (feeder3.HasValue) feederList.Add(feeder3.Value);

            // Buscar postes que coincidan con esos alimentadores
            var postes = ctx.Postes
                            .Where(p => feederList.Contains(p.AlimInterno))
                            .ToList();

            return postes;
        }
        public List<ElementStruct> DAPOST_GetStructByFeeder(int x_feeder_id)
        {          
            SigreContext ctx = new SigreContext();

            var posts = ctx.ElementStructs.FromSqlRaw("exec sp_GetPostsByFeeder @Feeder",
                new SqlParameter("@Feeder",x_feeder_id)
                ).ToList();

            return posts;
        }
    }
}
