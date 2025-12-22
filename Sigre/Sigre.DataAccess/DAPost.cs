using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;
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
                    Tercero = p.PostTerceros,
                    IdSed = p.PostSubestacion
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
                        Tercero = p.PostTerceros,
                        IdSed = (int) p.PostSubestacion
                    }).ToList();            

                return posts;
            }
        }

        //0 -> Baja Tension, 1 -> Media Tension
        public List<PinStruct> DAPOST_Pins(List<int> x_ids, int proyecto)
        {
            if (proyecto == 0)
            {
                var post = DAPOST_PinsBySubestacion(x_ids);
                return post;
            }
                
            else
                return DAPOST_PinsByFeeders(x_ids);
        }

        public int DAPOST_SaveFromSync(PosteSyncDto dto)
        {
            using var ctx = new SigreContext();

            // 🔹 INSERT (creado offline)
            if (dto.EstadoOffLine == 2)
            {
                var nuevo = new Poste
                {
                    PostEtiqueta = dto.PostEtiqueta,
                    PostCodigoNodo = dto.PostCodigoNodo,
                    PostLatitud = dto.PostLatitud,
                    PostLongitud = dto.PostLongitud,
                    AlimInterno = dto.AlimInterno,
                    PostMaterial = dto.PostMaterial,
                    PostArmadoTipo = dto.PostArmadoTipo,
                    PostArmadoMaterial = dto.PostArmadoMaterial,
                    PostRetenidaTipo = dto.PostRetenidaTipo,
                    PostRetenidaMaterial = dto.PostRetenidaMaterial,
                    PostSubestacion = dto.PostSubestacion,
                    PostTerceros = dto.PostTerceros,
                    PostInspeccionado = dto.PostInspeccionado,
                    PostEsBt = dto.PostEsBt,
                    PostEsMt = dto.PostEsMt
                };

                ctx.Postes.Add(nuevo);
                ctx.SaveChanges();

                return nuevo.PostInterno; // ⬅ devolver ID servidor
            }

            // 🔹 UPDATE
            if (dto.EstadoOffLine == 1 && dto.PostInterno.HasValue)
            {
                var existente = ctx.Postes
                    .FirstOrDefault(p => p.PostInterno == dto.PostInterno.Value);

                if (existente == null)
                    throw new Exception($"Poste {dto.PostInterno} no existe");

                existente.PostEtiqueta = dto.PostEtiqueta;
                existente.PostCodigoNodo = dto.PostCodigoNodo;
                existente.PostLatitud = dto.PostLatitud;
                existente.PostLongitud = dto.PostLongitud;
                existente.PostMaterial = dto.PostMaterial;
                existente.PostArmadoTipo = dto.PostArmadoTipo;
                existente.PostArmadoMaterial = dto.PostArmadoMaterial;
                existente.PostRetenidaTipo = dto.PostRetenidaTipo;
                existente.PostRetenidaMaterial = dto.PostRetenidaMaterial;
                existente.PostTerceros = dto.PostTerceros;
                existente.PostInspeccionado = dto.PostInspeccionado;

                ctx.SaveChanges();
                return existente.PostInterno;
            }

            throw new Exception("EstadoOffLine no válido");
        }

    }
}
