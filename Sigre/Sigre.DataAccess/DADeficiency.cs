using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;
using Sigre.Entities.Structs;

namespace Sigre.DataAccess
{
    public class DADeficiency
    {
        public void DADEFI_Save(Deficiencia x_deficiency)
        {
            //x_deficiency.InspInternoNavigation = null;

            SigreContext ctx = new SigreContext();

            if (x_deficiency.DefiInterno == 0)
            {
                x_deficiency.DefiFecRegistro = DateTime.Now;
                x_deficiency.DefiUsuarioInic = x_deficiency.DefiUsuarioMod;
                x_deficiency.DefiActivo = true;

                ctx.Deficiencias.Add(x_deficiency);
            }
            else
            {
                x_deficiency.DefiFecModificacion = DateTime.Now;

                var original = ctx.Deficiencias.SingleOrDefault(d => d.DefiInterno == x_deficiency.DefiInterno);
                ctx.Entry(original).CurrentValues.SetValues(x_deficiency);
            }
            ctx.SaveChanges();
        }

        public void DADEFI_DeficiencyInspected(int x_id)
        {
            SigreContext ctx = new SigreContext();

            var original = ctx.Deficiencias.SingleOrDefault(d => d.DefiInterno == x_id);
            Deficiencia x_deficiency = original;
            x_deficiency.DefiInspeccionado = true;
            ctx.Entry(original).CurrentValues.SetValues(x_deficiency);

            ctx.SaveChanges();
        }
        public void DADEFI_Delete(Deficiencia x_deficiency)
        {
            x_deficiency.InspInternoNavigation = null;
            x_deficiency.DefiActivo = false;
            x_deficiency.DefiFecRegistro = DateTime.Now;
            x_deficiency.DefiUsuarioInic = x_deficiency.DefiUsuarioMod;

            SigreContext ctx = new SigreContext();

            var original = ctx.Deficiencias.SingleOrDefault(d => d.DefiInterno == x_deficiency.DefiInterno);
            x_deficiency.DefiFecModificacion = original.DefiFecModificacion;
            ctx.Entry(original).CurrentValues.SetValues(x_deficiency);

            ctx.SaveChanges();
        }

        public List<Deficiencia> DADEFI_GetByElement(ElectricElement x_elementType, int x_ElementId)
        {
            SigreContext ctx = new SigreContext();

            string type =
                x_elementType == ElectricElement.Post ? "POST" :
                x_elementType == ElectricElement.Gap ? "VANO" :
                x_elementType == ElectricElement.SedBP ? "SED" :
                x_elementType == ElectricElement.SedCA ? "SED" :
                x_elementType == ElectricElement.SedMP ? "SED" :
                x_elementType == ElectricElement.SedPV ? "SED" : throw new ArgumentException();

            var deficiencies =
                (from d in ctx.Deficiencias
                 where d.DefiTipoElemento == type && d.DefiIdElemento == x_ElementId
                 select new Deficiencia() {
                     DefiActivo = d.DefiActivo,
                     DefiInterno = d.DefiInterno,
                     DefiArmadoMaterial = d.DefiArmadoMaterial,
                     DefiCodAmt = d.DefiCodAmt,
                     DefiCodDef = d.DefiCodDef,
                     DefiCodDen = d.DefiCodDen,
                     DefiCodigoElemento = d.DefiCodigoElemento,
                     DefiCodRes = d.DefiCodRes,
                     DefiComentario = d.DefiComentario,
                     DefiCoordX = d.DefiCoordX,
                     DefiCoordY = d.DefiCoordY,
                     DefiDistHorizontal = d.DefiDistHorizontal,
                     DefiDistTransversal = d.DefiDistTransversal,
                     DefiDistVertical = d.DefiDistVertical,
                     DefiEstado = d.DefiEstado,
                     DefiEstadoCriticidad = d.DefiEstadoCriticidad,
                     DefiEstadoSubsanacion = d.DefiEstadoSubsanacion,
                     DefiFechaCreacion = d.DefiFechaCreacion,
                     DefiFechaDenuncia = d.DefiFechaDenuncia,
                     DefiFechaInspeccion = d.DefiFechaInspeccion,
                     DefiFechaSubsanacion = d.DefiFechaSubsanacion,
                     DefiFecModificacion = d.DefiFecModificacion,
                     DefiFecRegistro = d.DefiFecRegistro,
                     DefiIdElemento = d.DefiIdElemento,
                     DefiLatitud = d.DefiLatitud,
                     DefiLongitud = d.DefiLongitud,
                     DefiNodoFinal = d.DefiNodoFinal,
                     DefiNodoInicial = d.DefiNodoInicial,
                     DefiNroOrden = d.DefiNroOrden,
                     DefiNumPostes = d.DefiNumPostes,
                     DefiNumSuministro = d.DefiNumSuministro,
                     DefiObservacion = d.DefiObservacion,
                     DefiPointX = d.DefiPointX,
                     DefiPointY = d.DefiPointY,
                     DefiPozoTierra = d.DefiPozoTierra,
                     DefiPozoTierra2 = d.DefiPozoTierra2,
                     DefiRefer1 = d.DefiRefer1,
                     DefiRefer2 = d.DefiRefer2,
                     DefiResponsable = d.DefiResponsable,
                     DefiRetenidaMaterial = d.DefiRetenidaMaterial,
                     DefiTipoArmado = d.DefiTipoArmado,
                     DefiTipoElemento = d.DefiTipoElemento,
                     DefiTipoMaterial = d.DefiTipoMaterial,
                     DefiTipoRetenida = d.DefiTipoRetenida,
                     DefiUsuarioInic = d.DefiUsuarioInic,
                     DefiUsuarioMod = d.DefiUsuarioMod,
                     DefiUsuCre = d.DefiUsuCre,
                     DefiUsuNpc = d.DefiUsuNpc,
                     InspInterno = d.InspInterno,
                     InspInternoNavigation = d.InspInternoNavigation,
                     TablInterno = d.TablInterno,
                     TipiInterno = d.TipiInterno,//
                     DefiInspeccionado = d.DefiInspeccionado,
                     DefiKeyWords = d.DefiKeyWords,
                     EstadoOffLine = 0,
                 }).ToList();

            return deficiencies;
        }

        public List<PinStruct> DADEFI_GetPinsByFeeders(List<int> x_feeders )
        {
            SigreContext ctx = new SigreContext();

            var query = (
                from a in ctx.Alimentadores
                join d in ctx.Deficiencias on a.AlimCodigo equals d.DefiCodAmt
                where x_feeders.Contains(a.AlimInterno)
                select new PinStruct
                {
                    Id = d.DefiInterno,
                    IdAlimentador = a.AlimInterno,
                    Label =  "",
                    Type = ElectricElement.Deficiency,
                    Latitude = d.DefiLatitud,
                    Longitude = d.DefiLongitud,
                    Inspeccionado = d.DefiInspeccionado
                }
            );

            return query.ToList();
        }

        public List<PinStruct> DADEFI_GetPinsBySubestacion(List<int> x_seds)
        {
            using var ctx = new SigreContext();

            // DEFICIENCIAS DE POST
            var postQuery =
                from s in ctx.Seds
                join a in ctx.Alimentadores on s.AlimInterno equals a.AlimInterno
                join p in ctx.Postes on s.SedInterno equals p.PostSubestacion
                join d in ctx.Deficiencias on p.PostInterno equals d.DefiIdElemento
                where d.DefiTipoElemento == "POST"
                      && x_seds.Contains(s.SedInterno)
                select new PinStruct
                {
                    Id = d.DefiInterno,
                    IdAlimentador = a.AlimInterno,
                    IdSed = s.SedInterno,
                    Label = "",
                    Type = ElectricElement.Deficiency,
                    Latitude = d.DefiLatitud,
                    Longitude = d.DefiLongitud,
                    Inspeccionado = d.DefiInspeccionado
                };

            // DEFICIENCIAS DE VANO
            var vanoQuery =
                from s in ctx.Seds
                join a in ctx.Alimentadores on s.AlimInterno equals a.AlimInterno
                join v in ctx.Vanos on s.SedInterno equals v.VanoSubestacion
                join d in ctx.Deficiencias on v.VanoInterno equals d.DefiIdElemento
                where d.DefiTipoElemento == "VANO"
                      && x_seds.Contains(s.SedInterno)
                select new PinStruct
                {
                    Id = d.DefiInterno,
                    IdAlimentador = a.AlimInterno,
                    IdSed = s.SedInterno,
                    Label = "",
                    Type = ElectricElement.Deficiency,
                    Latitude = d.DefiLatitud,
                    Longitude = d.DefiLongitud,
                    Inspeccionado = d.DefiInspeccionado
                };

            return postQuery.Union(vanoQuery).ToList();
        }


        public List<Deficiencia> DADEFI_GetByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();

            Alimentadore alim = ctx.Alimentadores.SingleOrDefault(a => a.AlimInterno == x_feeder_id);

            var query =
            (from d in ctx.Deficiencias
             where d.DefiCodAmt == alim.AlimCodigo
             select new Deficiencia()
             {
                 DefiActivo = d.DefiActivo,
                 DefiInterno = d.DefiInterno,
                 DefiArmadoMaterial = d.DefiArmadoMaterial,
                 DefiCodAmt = d.DefiCodAmt,
                 DefiCodDef = d.DefiCodDef,
                 DefiCodDen = d.DefiCodDen,
                 DefiCodigoElemento = d.DefiCodigoElemento,
                 DefiCodRes = d.DefiCodRes,
                 DefiComentario = d.DefiComentario,
                 DefiCoordX = d.DefiCoordX,
                 DefiCoordY = d.DefiCoordY,
                 DefiDistHorizontal = d.DefiDistHorizontal,
                 DefiDistTransversal = d.DefiDistTransversal,
                 DefiDistVertical = d.DefiDistVertical,
                 DefiEstado = d.DefiEstado,
                 DefiEstadoCriticidad = d.DefiEstadoCriticidad,
                 DefiEstadoSubsanacion = d.DefiEstadoSubsanacion,
                 DefiFechaCreacion = d.DefiFechaCreacion,
                 DefiFechaDenuncia = d.DefiFechaDenuncia,
                 DefiFechaInspeccion = d.DefiFechaInspeccion,
                 DefiFechaSubsanacion = d.DefiFechaSubsanacion,
                 DefiFecModificacion = d.DefiFecModificacion,
                 DefiFecRegistro = d.DefiFecRegistro,
                 DefiIdElemento = d.DefiIdElemento,
                 DefiLatitud = d.DefiLatitud,
                 DefiLongitud = d.DefiLongitud,
                 DefiNodoFinal = d.DefiNodoFinal,
                 DefiNodoInicial = d.DefiNodoInicial,
                 DefiNroOrden = d.DefiNroOrden,
                 DefiNumPostes = d.DefiNumPostes,
                 DefiNumSuministro = d.DefiNumSuministro,
                 DefiObservacion = d.DefiObservacion,
                 DefiPointX = d.DefiPointX,
                 DefiPointY = d.DefiPointY,
                 DefiPozoTierra = d.DefiPozoTierra,
                 DefiPozoTierra2 = d.DefiPozoTierra2,
                 DefiRefer1 = d.DefiRefer1,
                 DefiRefer2 = d.DefiRefer2,
                 DefiResponsable = d.DefiResponsable,
                 DefiRetenidaMaterial = d.DefiRetenidaMaterial,
                 DefiTipoArmado = d.DefiTipoArmado,
                 DefiTipoElemento = d.DefiTipoElemento,
                 DefiTipoMaterial = d.DefiTipoMaterial,
                 DefiTipoRetenida = d.DefiTipoRetenida,
                 DefiUsuarioInic = d.DefiUsuarioInic,
                 DefiUsuarioMod = d.DefiUsuarioMod,
                 DefiUsuCre = d.DefiUsuCre,
                 DefiUsuNpc = d.DefiUsuNpc,
                 InspInterno = d.InspInterno,
                 InspInternoNavigation = d.InspInternoNavigation,
                 TablInterno = d.TablInterno,
                 TipiInterno = d.TipiInterno,//
                 DefiInspeccionado = d.DefiInspeccionado,
                 DefiKeyWords = d.DefiKeyWords == null? "":d.DefiKeyWords,
                 EstadoOffLine = 0,
             });

            return query.ToList();
        }

        public List<Deficiencia> DADEFI_GetByListFeeders(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();

            var deficiencias = (
                from d in ctx.Deficiencias
                join a in ctx.Alimentadores on d.DefiCodAmt equals a.AlimCodigo
                where x_feeders.Contains(a.AlimInterno)
                select new Deficiencia
                {
                    DefiActivo = d.DefiActivo,
                    DefiInterno = d.DefiInterno,
                    DefiArmadoMaterial = d.DefiArmadoMaterial,
                    DefiCodAmt = d.DefiCodAmt,
                    DefiCodDef = d.DefiCodDef,
                    DefiCodDen = d.DefiCodDen,
                    DefiCodigoElemento = d.DefiCodigoElemento,
                    DefiCodRes = d.DefiCodRes,
                    DefiComentario = d.DefiComentario,
                    DefiCoordX = d.DefiCoordX,
                    DefiCoordY = d.DefiCoordY,
                    DefiDistHorizontal = d.DefiDistHorizontal,
                    DefiDistTransversal = d.DefiDistTransversal,
                    DefiDistVertical = d.DefiDistVertical,
                    DefiEstado = d.DefiEstado,
                    DefiEstadoCriticidad = d.DefiEstadoCriticidad,
                    DefiEstadoSubsanacion = d.DefiEstadoSubsanacion,
                    DefiFechaCreacion = d.DefiFechaCreacion,
                    DefiFechaDenuncia = d.DefiFechaDenuncia,
                    DefiFechaInspeccion = d.DefiFechaInspeccion,
                    DefiFechaSubsanacion = d.DefiFechaSubsanacion,
                    DefiFecModificacion = d.DefiFecModificacion,
                    DefiFecRegistro = d.DefiFecRegistro,
                    DefiIdElemento = d.DefiIdElemento,
                    DefiLatitud = d.DefiLatitud,
                    DefiLongitud = d.DefiLongitud,
                    DefiNodoFinal = d.DefiNodoFinal,
                    DefiNodoInicial = d.DefiNodoInicial,
                    DefiNroOrden = d.DefiNroOrden,
                    DefiNumPostes = d.DefiNumPostes,
                    DefiNumSuministro = d.DefiNumSuministro,
                    DefiObservacion = d.DefiObservacion,
                    DefiPointX = d.DefiPointX,
                    DefiPointY = d.DefiPointY,
                    DefiPozoTierra = d.DefiPozoTierra,
                    DefiPozoTierra2 = d.DefiPozoTierra2,
                    DefiRefer1 = d.DefiRefer1,
                    DefiRefer2 = d.DefiRefer2,
                    DefiResponsable = d.DefiResponsable,
                    DefiRetenidaMaterial = d.DefiRetenidaMaterial,
                    DefiTipoArmado = d.DefiTipoArmado,
                    DefiTipoElemento = d.DefiTipoElemento,
                    DefiTipoMaterial = d.DefiTipoMaterial,
                    DefiTipoRetenida = d.DefiTipoRetenida,
                    DefiUsuarioInic = d.DefiUsuarioInic,
                    DefiUsuarioMod = d.DefiUsuarioMod,
                    DefiUsuCre = d.DefiUsuCre,
                    DefiUsuNpc = d.DefiUsuNpc,
                    InspInterno = d.InspInterno,
                    InspInternoNavigation = d.InspInternoNavigation,
                    TablInterno = d.TablInterno,
                    TipiInterno = d.TipiInterno,//
                    DefiInspeccionado = d.DefiInspeccionado,
                    DefiKeyWords = d.DefiKeyWords == null ? "" : d.DefiKeyWords,
                    EstadoOffLine = 0,
                }
            ).ToList();

            return deficiencias;
        }

        public List<Deficiencia> DADEFI_GetByListSeds(List<int> x_seds)
        {
            using (var ctx = new SigreContext())
            {
                // Obtener los IDs de postes correspondientes a las subestaciones
                var Idpostes = ctx.Postes
                    .Where(p => x_seds.Contains((int)p.PostSubestacion))
                    .Select(p => p.PostInterno)
                    .ToList();

                // Obtener los IDs de vanos correspondientes a las subestaciones
                var Idvanos = ctx.Vanos
                    .Where(v => x_seds.Contains((int)v.VanoSubestacion))
                    .Select(v => v.VanoInterno)
                    .ToList();

                // Traer las deficiencias de postes y vanos de forma materializada (ToList)
                var defPostes = ctx.Deficiencias
                    .Where(dp => dp.DefiTipoElemento == "POST" && Idpostes.Contains((int)dp.DefiIdElemento))
                    .ToList();

                var defVanos = ctx.Deficiencias
                    .Where(dv => dv.DefiTipoElemento == "VANO" && Idvanos.Contains((int)dv.DefiIdElemento))
                    .ToList();

                // Combinar resultados
                var deficiencias = new List<Deficiencia>();
                deficiencias.AddRange(defPostes);
                deficiencias.AddRange(defVanos);

                return deficiencias;
            }
        }


        public List<Deficiencia> DADEFI_GetByProject(List<int> x_ids, int x_project)
        {
            if (x_project == 0)
                return DADEFI_GetByListSeds(x_ids);
            else
                return DADEFI_GetByListFeeders(x_ids);
        }

        public void DADEFI_SaveDeficienciesAndFiles(OffLineStruct off)
        {
            /*
             * 0 -> sin estado
             * 1 -> Modificado
             * 2 -> Nuevo
            */
            using (SigreContext ctx = new SigreContext())
            {
                using (IDbContextTransaction transaction = ctx.Database.BeginTransaction())
                {
                    try
                    {
                        List<Deficiencia> deficiencias = off.Deficiencies ?? new List<Deficiencia>();
                        List<Archivo> archivos = off.Files ?? new List<Archivo>();

                        foreach (var item in deficiencias)
                        {
                            //if (item == null) continue;

                            item.DefiFechaCreacion = DateTime.Now;

                            int deficiencyId = item.DefiInterno;

                            if (item.DefiEstado != "S") // Nuevo
                            {
                                ctx.Deficiencias.Add(item);
                            }
                            else // Modificado
                            {
                                var original = ctx.Deficiencias.SingleOrDefault(d => d.DefiInterno == deficiencyId);

                                if (original != null)
                                {
                                    ctx.Entry(original).CurrentValues.SetValues(item);
                                }
                                else
                                {
                                    ctx.Deficiencias.Add(item);
                                }
                            }

                            // Guardar aquí para que el DefiInterno se actualice (identity generado en DB)
                            ctx.SaveChanges();

                            // Asociar archivos a la deficiencia ya persistida
                            var archivosDef = archivos.Where(f => f.ArchCodTabla == deficiencyId).ToList();

                            foreach (Archivo archivo in archivosDef)
                            {
                                archivo.ArchCodTabla = item.DefiInterno; // ahora con el nuevo ID
                                ctx.Archivos.Add(archivo);
                            }

                            ctx.SaveChanges();
                        }

                        transaction.Commit();
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        throw; // no uses "throw ex;" porque pierdes el stack trace
                    }
                }
            }
        }

        public List<(int localId, int serverId)> DADefi_SyncFromSQLite(
            List<DeficienciaSyncDto> deficienciasOffline)
        {
            using var ctx = new SigreContext();
            var resultado = new List<(int, int)>();

            foreach (var dto in deficienciasOffline)
            {
                // ===============================
                // 🔹 INSERT (nuevo desde SQLite)
                // ===============================
                if (dto.EstadoOffLine == 2)
                {
                    var nueva = new Deficiencia
                    {
                        DefiEstado = dto.DefiEstado,
                        InspInterno = dto.InspInterno,
                        TablInterno = dto.TablInterno,
                        DefiCodigoElemento = dto.DefiCodigoElemento,
                        TipiInterno = dto.TipiInterno,
                        DefiNumSuministro = dto.DefiNumSuministro,

                        DefiFechaDenuncia = dto.DefiFechaDenuncia,
                        DefiFechaInspeccion = dto.DefiFechaInspeccion,
                        DefiFechaSubsanacion = dto.DefiFechaSubsanacion,

                        DefiObservacion = dto.DefiObservacion,
                        DefiEstadoSubsanacion = dto.DefiEstadoSubsanacion,

                        DefiLatitud = dto.DefiLatitud,
                        DefiLongitud = dto.DefiLongitud,

                        DefiTipoElemento = dto.DefiTipoElemento,
                        DefiDistHorizontal = dto.DefiDistHorizontal,
                        DefiDistVertical = dto.DefiDistVertical,
                        DefiDistTransversal = dto.DefiDistTransversal,

                        DefiIdElemento = dto.DefiIdElemento,
                        DefiFecRegistro = dto.DefiFecRegistro,

                        DefiCodDef = dto.DefiCodDef,
                        DefiCodRes = dto.DefiCodRes,
                        DefiCodDen = dto.DefiCodDen,

                        DefiRefer1 = dto.DefiRefer1,
                        DefiRefer2 = dto.DefiRefer2,

                        DefiCoordX = dto.DefiCoordX,
                        DefiCoordY = dto.DefiCoordY,

                        DefiCodAmt = dto.DefiCodAmt,
                        DefiNroOrden = dto.DefiNroOrden,

                        DefiPointX = dto.DefiPointX,
                        DefiPointY = dto.DefiPointY,

                        DefiUsuCre = dto.DefiUsuCre,
                        DefiUsuNpc = dto.DefiUsuNpc,
                        DefiFecModificacion = dto.DefiFecModificacion,
                        DefiFechaCreacion = dto.DefiFechaCreacion,

                        DefiTipoMaterial = dto.DefiTipoMaterial,
                        DefiNodoInicial = dto.DefiNodoInicial,
                        DefiNodoFinal = dto.DefiNodoFinal,
                        DefiTipoRetenida = dto.DefiTipoRetenida,
                        DefiRetenidaMaterial = dto.DefiRetenidaMaterial,
                        DefiTipoArmado = dto.DefiTipoArmado,
                        DefiArmadoMaterial = dto.DefiArmadoMaterial,

                        DefiNumPostes = dto.DefiNumPostes,
                        DefiPozoTierra = dto.DefiPozoTierra,
                        DefiResponsable = dto.DefiResponsable,
                        DefiComentario = dto.DefiComentario,
                        DefiPozoTierra2 = dto.DefiPozoTierra2,

                        DefiUsuarioInic = dto.DefiUsuarioInic,
                        DefiUsuarioMod = dto.DefiUsuarioMod,
                        DefiActivo = dto.DefiActivo,
                        DefiEstadoCriticidad = dto.DefiEstadoCriticidad,
                        DefiInspeccionado = dto.DefiInspeccionado,
                    };

                    ctx.Deficiencias.Add(nueva);
                    ctx.SaveChanges();

                    resultado.Add((dto.DefiInterno, nueva.DefiInterno));
                }
                // 🔹 UPDATE
                else if (dto.EstadoOffLine == 1)
                {
                    var existente = dto.DefiServerId.HasValue
                        ? ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == dto.DefiServerId)
                        : ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == dto.DefiInterno);

                    if (existente == null) continue;

                    existente.DefiEstado = dto.DefiEstado;
                    existente.DefiObservacion = dto.DefiObservacion;
                    existente.DefiEstadoSubsanacion = dto.DefiEstadoSubsanacion;
                    existente.DefiEstadoCriticidad = dto.DefiEstadoCriticidad;
                    existente.DefiLatitud = dto.DefiLatitud;
                    existente.DefiLongitud = dto.DefiLongitud;
                    existente.DefiInspeccionado = dto.DefiInspeccionado;
                    existente.DefiUsuarioMod = dto.DefiUsuarioMod;
                    existente.DefiFecModificacion = DateTime.Now;

                    ctx.SaveChanges();
                    resultado.Add((dto.DefiInterno, existente.DefiInterno));
                }
                // 🔹 DELETE LÓGICO
                else if (dto.EstadoOffLine == 3)
                {
                    var existente = dto.DefiServerId.HasValue
                        ? ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == dto.DefiServerId)
                        : ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == dto.DefiInterno);

                    if (existente == null) continue;

                    existente.DefiActivo = false;
                    existente.DefiUsuarioMod = dto.DefiUsuarioMod;
                    existente.DefiFecModificacion = DateTime.Now;

                    ctx.SaveChanges();
                    resultado.Add((dto.DefiInterno, existente.DefiInterno));
                }
            }

            return resultado;
        }
    }
}
