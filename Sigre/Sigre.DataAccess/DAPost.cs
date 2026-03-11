using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
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
                new SqlParameter("@Feeder", x_feeder_id)
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
                        IdSed = (int)p.PostSubestacion
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

        public List<(int localId, int serverId)> DAPOST_SyncFromSQLite(List<PosteSyncDto> postesOffline)
        {
            using var ctx = new SigreContext();
            var resultado = new List<(int localId, int serverId)>();

            foreach (var dto in postesOffline)
            {
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
                        PostEsMt = dto.PostEsMt,
                        PostAltura = dto.PostAltura,
                        PostTramo = dto.PostTramo,
                        PostVereda = dto.PostVereda

                    };

                    ctx.Postes.Add(nuevo);
                    ctx.SaveChanges();

                    // localId = PostInterno de SQLite
                    resultado.Add((dto.PostInterno ?? 0, nuevo.PostInterno));
                }

                // 🔹 UPDATE (existente)
                else if ((dto.EstadoOffLine == 1 || dto.EstadoOffLine == 0)
                         && dto.PostInterno.HasValue)
                {
                    var existente = ctx.Postes
                        .FirstOrDefault(p => p.PostInterno == dto.PostInterno.Value);

                    if (existente == null)
                        continue;

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
                    existente.PostEsBt = dto.PostEsBt;
                    existente.PostEsMt = dto.PostEsMt;
                    existente.PostAltura = dto.PostAltura;
                    existente.PostTramo = dto.PostTramo;
                    existente.PostVereda = dto.PostVereda;

                    ctx.SaveChanges();

                    resultado.Add((existente.PostInterno, existente.PostInterno));
                }
            }

            return resultado;
        }


        public int DAPOST_GuardarWeb(Poste x_poste)
        {
            try
            {
                using (var ctx = new SigreContext())
                {
                    // === 0. VALIDACIÓN DE DUPLICADOS (CÓDIGO GIS) ===
                    // Verifica si existe otro poste con el mismo código, PERO que no sea este mismo (para permitir edición)
                    if (!string.IsNullOrEmpty(x_poste.PostCodigoNodo))
                    {
                        bool yaExiste = ctx.Postes.Any(p =>
                            p.PostCodigoNodo == x_poste.PostCodigoNodo && // Mismo Código
                            p.PostInterno != x_poste.PostInterno          // Diferente ID (No soy yo mismo)
                        );

                        if (yaExiste)
                        {
                            throw new Exception($"El Código GIS '{x_poste.PostCodigoNodo}' ya existe en la base de datos.");
                        }
                    }
                    // =========================================================
                    // CASO 1: INSERTAR (Nuevo Registro)
                    // =========================================================
                    if (x_poste.PostInterno == 0)
                    {
                        // Reglas de Negocio para NUEVOS
                        x_poste.PostInspeccionado = false;
                        x_poste.PostEsBt = true;
                        x_poste.PostEsMt = null;

                        // Guardado directo
                        ctx.Postes.Add(x_poste);
                        ctx.SaveChanges();
                        return x_poste.PostInterno;
                    }

                    // =========================================================
                    // CASO 2: ACTUALIZAR (Registro Existente)
                    // =========================================================
                    else
                    {
                        // 1. Buscamos el original en BD para no perder datos ocultos
                        var existente = ctx.Postes.FirstOrDefault(p => p.PostInterno == x_poste.PostInterno);

                        if (existente == null)
                            throw new Exception($"El Poste con ID {x_poste.PostInterno} no existe.");

                        // 2. Mapeo Manual (Actualizamos solo lo que el usuario ve en el form)

                        // Identificación
                        existente.PostEtiqueta = x_poste.PostEtiqueta;
                        existente.PostCodigoNodo = x_poste.PostCodigoNodo;

                        // Ubicación y Red
                        existente.PostLatitud = x_poste.PostLatitud;
                        existente.PostLongitud = x_poste.PostLongitud;
                        existente.AlimInterno = x_poste.AlimInterno;
                        existente.PostSubestacion = x_poste.PostSubestacion; // Puede cambiar de SED

                        // Características Técnicas
                        existente.PostTerceros = x_poste.PostTerceros;
                        existente.PostMaterial = x_poste.PostMaterial;
                        existente.PostAltura = x_poste.PostAltura;
                        existente.PostRetenidaTipo = x_poste.PostRetenidaTipo;
                        existente.PostTerceros = x_poste.PostTerceros;
                        existente.PostVereda = x_poste.PostVereda;
                        // NOTA: No actualizamos 'PostInspeccionado' para no borrar el trabajo de campo si ya se hizo.

                        // 3. Guardar Cambios
                        ctx.SaveChanges();
                        return existente.PostInterno;
                    }
                }
            }
            catch (Exception ex)
            {
                // Truco para ver el error real de SQL
                var mensajeSQL = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                throw new Exception($"ERROR SQL POSTE: {mensajeSQL}");
            }
        }
        public List<Poste> DAPoste_GetByFeeder(int x_feeder_id)
        {
            using (SigreContext ctx = new SigreContext())
            {
                // 1. Deshabilitar el rastreo de cambios (Aumenta mucho la velocidad en lectura)
                ctx.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;

                var postes = ctx.Postes
                    .Where(p => p.AlimInterno == x_feeder_id)
                    // 2. Select EXPLÍCITO: Solo mapeamos datos primitivos, NADA de objetos anidados (Navigation)
                    .Select(p => new Poste()
                    {
                        PostInterno = p.PostInterno,
                        PostEtiqueta = p.PostEtiqueta,
                        PostCodigoNodo = p.PostCodigoNodo,
                        PostLatitud = p.PostLatitud,
                        PostLongitud = p.PostLongitud,
                        AlimInterno = p.AlimInterno,

                        PostSubestacion = p.PostSubestacion,
                        PostMaterial = p.PostMaterial,
                        PostAltura = p.PostAltura,
                        PostTramo = p.PostTramo,
                        PostVereda = p.PostVereda,

                        PostArmadoTipo = p.PostArmadoTipo,
                        PostArmadoMaterial = p.PostArmadoMaterial,
                        PostRetenidaTipo = p.PostRetenidaTipo,
                        PostRetenidaMaterial = p.PostRetenidaMaterial,

                        PostTerceros = p.PostTerceros,
                        PostInspeccionado = p.PostInspeccionado,
                        PostEsBt = p.PostEsBt,
                        PostEsMt = p.PostEsMt,

                    })
                    .ToList(); // La consulta se ejecuta aquí

                return postes;
            }
        }
        public List<Poste> DAPoste_GetBySedWeb(int idSed)
        {
            using (SigreContext ctx = new SigreContext())
            {
                // 🔥 OPTIMIZACIÓN: AsNoTracking + Select Manual para evitar JSON gigante
                var postes = ctx.Postes

                    .Where(p => p.PostSubestacion == idSed) // Filtro por SED
                    .Select(p => new Poste()
                    {
                        PostInterno = p.PostInterno,
                        PostEtiqueta = p.PostEtiqueta,
                        PostCodigoNodo = p.PostCodigoNodo,
                        PostLatitud = p.PostLatitud,
                        PostLongitud = p.PostLongitud,
                        AlimInterno = p.AlimInterno,
                        PostSubestacion = p.PostSubestacion, // Importante retornar esto

                        // Detalles físicos
                        PostMaterial = p.PostMaterial,
                        PostAltura = p.PostAltura,
                        PostTramo = p.PostTramo,

                        PostRetenidaTipo = p.PostRetenidaTipo,

                        // Estados
                        PostTerceros = p.PostTerceros,
                        PostInspeccionado = p.PostInspeccionado,
                        PostEsBt = p.PostEsBt,
                    })
                    .ToList();

                return postes;
            }
        }
        // Añadimos alimentadorId y sedId como parámetros opcionales (nulleables)
        // 🔥 CAMBIO AQUÍ: Reemplazamos 'string busqueda = ""' por 'string codigo = "", string etiqueta = ""'
        public PagedResult<Poste> DAPoste_GetPaginado(int skip, int take, string codigo = "", string etiqueta = "", int? alimentadorId = null, int? sedId = null)
        {
            using (SigreContext ctx = new SigreContext())
            {
                ctx.ChangeTracker.LazyLoadingEnabled = false;
                ctx.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;

                // 1. Iniciamos consulta base + Restricción BT
                var query = ctx.Postes.AsNoTracking().Where(p => p.PostEsBt == true).AsQueryable();

                // 2. FILTROS JERÁRQUICOS (NUEVO - Esto da la velocidad extrema)
                if (alimentadorId.HasValue && alimentadorId.Value > 0)
                {
                    query = query.Where(p => p.AlimInterno == alimentadorId.Value);
                }

                if (sedId.HasValue && sedId.Value > 0)
                {
                    query = query.Where(p => p.PostSubestacion == sedId.Value);
                }

                // 3. 🔥 FILTROS DE TEXTO INTELIGENTES (Código y Etiqueta separados)
                bool hasCodigo = !string.IsNullOrWhiteSpace(codigo);
                bool hasEtiqueta = !string.IsNullOrWhiteSpace(etiqueta);

                if (hasCodigo && hasEtiqueta)
                {
                    // Si desde el frontend envían AMBOS, buscamos que coincida uno U otro (OR)
                    codigo = codigo.Trim();
                    etiqueta = etiqueta.Trim();
                    query = query.Where(p => p.PostCodigoNodo.Contains(codigo) ||
                                             (p.PostEtiqueta != null && p.PostEtiqueta.Contains(etiqueta)));
                }
                else if (hasCodigo)
                {
                    // Si solo envían el Código GIS
                    codigo = codigo.Trim();
                    query = query.Where(p => p.PostCodigoNodo.Contains(codigo));
                }
                else if (hasEtiqueta)
                {
                    // Si solo envían la Etiqueta
                    etiqueta = etiqueta.Trim();
                    query = query.Where(p => p.PostEtiqueta != null && p.PostEtiqueta.Contains(etiqueta));
                }

                int totalRecords = query.Count();

                var data = query
                    .OrderByDescending(p => p.PostInterno)
                    .Skip(skip)
                    .Take(take)
                    .Select(p => new Poste()
                    {
                        PostInterno = p.PostInterno,
                        PostEtiqueta = p.PostEtiqueta,
                        PostCodigoNodo = p.PostCodigoNodo,
                        PostLatitud = p.PostLatitud,
                        PostLongitud = p.PostLongitud,
                        AlimInterno = p.AlimInterno,
                        PostSubestacion = p.PostSubestacion,
                        PostMaterial = p.PostMaterial,
                        PostAltura = p.PostAltura,
                        PostTramo = p.PostTramo,
                        PostRetenidaTipo = p.PostRetenidaTipo,
                        PostTerceros = p.PostTerceros,
                        PostInspeccionado = p.PostInspeccionado,
                        PostEsBt = p.PostEsBt,
                        TramInterno = p.TramInterno,
                        PostVereda = p.PostVereda
                    })
                    .ToList();

                return new PagedResult<Poste> { TotalRecords = totalRecords, Data = data };
            }
        }
    }
}
