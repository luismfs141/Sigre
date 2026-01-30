using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAPin
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
                    Tercero = p.PostTerceros,
                    IdSed = p.PostSubestacion
                }
            );
            return posts.ToList();
        }
        // Versión Simplificada: Recibe UN solo ID
        public List<PinStruct> DAPOST_PinsBySubestacion(int idSed)
        {
            using (var ctx = new SigreContext())
            {
                var posts = ctx.Postes
                    // Validación directa: PostSubestacion igual al ID recibido
                    .Where(p => p.PostSubestacion == idSed)
                    .Select(p =>
                        new PinStruct()
                        {
                            Id = p.PostInterno,
                            Label = p.PostEtiqueta,
                            // Manejo de nulos
                            Latitude = p.PostLatitud ?? 0,
                            Longitude = p.PostLongitud ?? 0,

                            Type = ElectricElement.Post,
                            ElementCode = p.PostCodigoNodo,
                            IdAlimentador = p.AlimInterno,
                            Inspeccionado = p.PostInspeccionado,
                            Tercero = p.PostTerceros,
                            IdSed = p.PostSubestacion
                        }
                    );

                return posts.ToList();
            }
        }
    }
}
