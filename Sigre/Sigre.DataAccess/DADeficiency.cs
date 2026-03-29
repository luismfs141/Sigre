using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;
using Sigre.Entities.Structs;
using System.Data;
using System.Linq;
using System.Runtime.InteropServices;

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
                //x_deficiency.DefiFecModificacion = DateTime.Now;
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
                     TipiInterno = d.TipiInterno,
                     DefiInspeccionado = d.DefiInspeccionado,
                     DefiKeyWords = d.DefiKeyWords,
                     DefiAccesibilidad = d.DefiAccesibilidad,
                     DefiTipoCruce = d.DefiTipoCruce,
                     CodopInterno = d.CodopInterno,

                     EstadoOffLine = 0,
                 }).ToList();

            return deficiencies;
        }

        public List<PinStruct> DADEFI_GetPinsByFeeders(List<int> x_feeders)
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
                    Label = "",
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
                 DefiKeyWords = d.DefiKeyWords == null ? "" : d.DefiKeyWords,
                 DefiAccesibilidad = d.DefiAccesibilidad,
                 DefiTipoCruce = d.DefiTipoCruce,
                 CodopInterno = d.CodopInterno,
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
                    DefiAccesibilidad = d.DefiAccesibilidad,
                    DefiTipoCruce = d.DefiTipoCruce,
                    CodopInterno = d.CodopInterno,
                    EstadoOffLine = 0,
                }
            ).ToList();

            return deficiencias;
        }

        public List<Deficiencia> DADEFI_GetByListSeds(List<int> x_seds)
        {
            using (var ctx = new SigreContext())
            {
                // 1. Desactivamos el Tracking para consultas de solo lectura (MEJORA CRÍTICA DE RAM)
                ctx.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;

                // 2. Usamos JOINS directos en lugar de traer los IDs a memoria
                var defPostes = from d in ctx.Deficiencias
                                join p in ctx.Postes on d.DefiIdElemento equals p.PostInterno
                                where d.DefiTipoElemento == "POST" && x_seds.Contains((int)p.PostSubestacion)
                                select d;

                var defVanos = from d in ctx.Deficiencias
                               join v in ctx.Vanos on d.DefiIdElemento equals v.VanoInterno
                               where d.DefiTipoElemento == "VANO" && x_seds.Contains((int)v.VanoSubestacion)
                               select d;

                // 3. Unimos las consultas a nivel de SQL y ejecutamos un solo viaje a la BD
                return defPostes.Union(defVanos).ToList();
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

        public List<(int localId, int serverId)> DADefi_SyncFromSQLite(List<DeficienciaSyncDto> deficienciasOffline)
        {
            using var ctx = new SigreContext();

            if (deficienciasOffline == null || deficienciasOffline.Count == 0)
                return new List<(int localId, int serverId)>();

            using var tx = ctx.Database.BeginTransaction();

            try
            {
                var mappings = new List<(int localId, Deficiencia entity)>();

                foreach (var dto in deficienciasOffline)
                {
                    if (string.IsNullOrWhiteSpace(dto.DefiCol3))
                        throw new Exception($"La deficiencia local {dto.DefiInterno} no tiene DefiCol3.");

                    var existente = ctx.Deficiencias.FirstOrDefault(d => d.DefiCol3 == dto.DefiCol3);

                    if (existente != null)
                    {
                        existente.DefiEstado = dto.DefiEstado;
                        existente.DefiObservacion = dto.DefiObservacion;
                        existente.DefiComentario = dto.DefiComentario;
                        existente.DefiNumSuministro = dto.DefiNumSuministro;
                        existente.DefiDistHorizontal = dto.DefiDistHorizontal;
                        existente.DefiDistVertical = dto.DefiDistVertical;
                        existente.DefiEstadoSubsanacion = dto.DefiEstadoSubsanacion;
                        existente.DefiEstadoCriticidad = dto.DefiEstadoCriticidad;
                        existente.DefiLatitud = dto.DefiLatitud;
                        existente.DefiLongitud = dto.DefiLongitud;
                        existente.DefiInspeccionado = dto.DefiInspeccionado;
                        existente.DefiUsuarioMod = dto.DefiUsuarioMod;
                        existente.DefiFecModificacion = dto.DefiFecModificacion;
                        existente.DefiAccesibilidad = dto.DefiAccesibilidad;
                        existente.DefiTipoCruce = dto.DefiTipoCruce;
                        existente.CodopInterno = dto.CodopInterno;
                        existente.DefiActivo = dto.DefiActivo;
                        existente.DefiCol1 = dto.DefiCol1;
                        existente.DefiCol2 = dto.DefiCol2;

                        mappings.Add((dto.DefiInterno, existente));
                    }
                    else
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
                            DefiAccesibilidad = dto.DefiAccesibilidad,
                            DefiTipoCruce = dto.DefiTipoCruce,
                            DefiCol3 = dto.DefiCol3,
                            DefiCol2 = dto.DefiCol2,
                            DefiCol1 = dto.DefiCol1,
                            CodopInterno = dto.CodopInterno,
                        };

                        ctx.Deficiencias.Add(nueva);
                        mappings.Add((dto.DefiInterno, nueva));
                    }
                }

                ctx.SaveChanges();
                tx.Commit();

                return mappings
                    .Select(x => (x.localId, x.entity.DefiInterno))
                    .ToList();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }


        public Deficiencia DADEFI_GetById(int x_defiInterno)
        {
            using (SigreContext ctx = new SigreContext())
            {
                var deficiencia = ctx.Deficiencias
                    .FirstOrDefault(d => d.DefiInterno == x_defiInterno);

                return deficiencia;
            }
        }
        public List<Deficiencia> DADEFI_GetByCodigoGis(string x_codigoGis)
        {
            using (SigreContext ctx = new SigreContext())
            {
                if (string.IsNullOrEmpty(x_codigoGis))
                {
                    return new List<Deficiencia>();
                }

                var listaDeficiencias = ctx.Deficiencias
                                           .Where(d => d.DefiCodigoElemento == x_codigoGis)
                                           .ToList();

                return listaDeficiencias;
            }
        }
        public List<Deficiencia> DADEFI_GetBySed(int x_sed)
        {
            using (var ctx = new SigreContext())
            {
                // 1. Obtener los IDs de POSTES vinculados a la columna POST_Subestacion
                // Verificamos explícitamente la columna de la imagen (POST_Subestacion)
                var idPostes = ctx.Postes
                    .Where(p => p.PostSubestacion == x_sed)
                    .Select(p => p.PostInterno)
                    .ToList();

                // 2. Obtener los IDs de VANOS vinculados a su columna de Subestación
                var idVanos = ctx.Vanos
                    .Where(v => v.VanoSubestacion == x_sed)
                    .Select(v => v.VanoInterno)
                    .ToList();

                // 3. Recuperar Deficiencias (Manejo seguro de nulos en DefiIdElemento)

                // A) Deficiencias de Postes encontrados
                var defPostes = ctx.Deficiencias
                    .Where(d => d.DefiTipoElemento == "POST"
                             && d.DefiIdElemento != null // Asegurar que no sea nulo antes de comparar
                             && idPostes.Contains((int)d.DefiIdElemento))
                    .ToList();

                // B) Deficiencias de Vanos encontrados
                var defVanos = ctx.Deficiencias
                    .Where(d => d.DefiTipoElemento == "VANO"
                             && d.DefiIdElemento != null
                             && idVanos.Contains((int)d.DefiIdElemento))
                    .ToList();

                // 4. Combinar y retornar
                var resultado = new List<Deficiencia>();
                resultado.AddRange(defPostes);
                resultado.AddRange(defVanos);

                return resultado;
            }
        }

        public Deficiencia DADEFI_ConvertDeficiency(DeficienciaSyncDto def_offline)
        {
            return new Deficiencia
            {
                // 🔑 Identificadores
                DefiInterno = def_offline.DefiInterno,

                // 📌 Estado
                DefiEstado = def_offline.DefiEstado,

                // 🔍 Relaciones
                InspInterno = def_offline.InspInterno,
                TablInterno = def_offline.TablInterno,
                TipiInterno = def_offline.TipiInterno,

                // 📍 Elemento
                DefiCodigoElemento = def_offline.DefiCodigoElemento,
                DefiTipoElemento = def_offline.DefiTipoElemento,
                DefiIdElemento = def_offline.DefiIdElemento,

                // 📅 Fechas
                DefiFechaDenuncia = def_offline.DefiFechaDenuncia,
                DefiFechaInspeccion = def_offline.DefiFechaInspeccion,
                DefiFechaSubsanacion = def_offline.DefiFechaSubsanacion,
                DefiFecRegistro = def_offline.DefiFecRegistro,
                DefiFecModificacion = def_offline.DefiFecModificacion,
                DefiFechaCreacion = def_offline.DefiFechaCreacion,

                // 📝 Descripción
                DefiObservacion = def_offline.DefiObservacion,
                DefiComentario = def_offline.DefiComentario,
                DefiEstadoSubsanacion = def_offline.DefiEstadoSubsanacion,

                // 📐 Coordenadas
                DefiLatitud = def_offline.DefiLatitud,
                DefiLongitud = def_offline.DefiLongitud,
                DefiCoordX = def_offline.DefiCoordX,
                DefiCoordY = def_offline.DefiCoordY,
                DefiPointX = def_offline.DefiPointX,
                DefiPointY = def_offline.DefiPointY,

                // 📏 Distancias
                DefiDistHorizontal = def_offline.DefiDistHorizontal,
                DefiDistVertical = def_offline.DefiDistVertical,
                DefiDistTransversal = def_offline.DefiDistTransversal,

                // 🏗️ Infraestructura
                DefiTipoMaterial = def_offline.DefiTipoMaterial,
                DefiNodoInicial = def_offline.DefiNodoInicial,
                DefiNodoFinal = def_offline.DefiNodoFinal,
                DefiTipoRetenida = def_offline.DefiTipoRetenida,
                DefiRetenidaMaterial = def_offline.DefiRetenidaMaterial,
                DefiTipoArmado = def_offline.DefiTipoArmado,
                DefiArmadoMaterial = def_offline.DefiArmadoMaterial,
                DefiNumPostes = def_offline.DefiNumPostes,
                DefiPozoTierra = def_offline.DefiPozoTierra,
                DefiPozoTierra2 = def_offline.DefiPozoTierra2,

                // 👤 Usuarios
                DefiUsuCre = def_offline.DefiUsuCre,
                DefiUsuNpc = def_offline.DefiUsuNpc,
                DefiUsuarioInic = def_offline.DefiUsuarioInic,
                DefiUsuarioMod = def_offline.DefiUsuarioMod,

                // ⚙️ Control
                DefiActivo = def_offline.DefiActivo ?? true,
                DefiResponsable = def_offline.DefiResponsable,
                DefiInspeccionado = def_offline.DefiInspeccionado,
                DefiEstadoCriticidad = def_offline.DefiEstadoCriticidad,

                // 🚧 Otros
                DefiAccesibilidad = def_offline.DefiAccesibilidad,
                DefiTipoCruce = def_offline.DefiTipoCruce,
                DefiNumSuministro = def_offline.DefiNumSuministro,
                DefiCodDef = def_offline.DefiCodDef,
                DefiCodRes = def_offline.DefiCodRes,
                DefiCodDen = def_offline.DefiCodDen,
                DefiRefer1 = def_offline.DefiRefer1,
                DefiRefer2 = def_offline.DefiRefer2,
                DefiCodAmt = def_offline.DefiCodAmt,
                DefiNroOrden = def_offline.DefiNroOrden,
                DefiCol3 = def_offline.DefiCol3,
                DefiCol2 = def_offline.DefiCol2,
                DefiCol1 = def_offline.DefiCol1,
                CodopInterno = def_offline.CodopInterno,
            };
        }
        public int DADEFI_ExistDeficiency(Deficiencia def)
        {
            using var ctx = new SigreContext();

            IQueryable<Deficiencia> query = ctx.Deficiencias
                .Where(d => d.DefiActivo == true);

            if (def.TipiInterno != 60)
            {
                // 🔹 Validación normal
                query = query.Where(d =>
                    d.DefiCodigoElemento == def.DefiCodigoElemento &&
                    d.TipiInterno == def.TipiInterno
                );
            }
            else
            {
                // 🔹 Tipificación 60 → comparación completa
                query = query.Where(d =>
                    d.TipiInterno == 60 &&
                    d.DefiCodigoElemento == def.DefiCodigoElemento &&
                    d.DefiNumSuministro == def.DefiNumSuministro &&
                    d.DefiTipoElemento == def.DefiTipoElemento &&
                    d.DefiLatitud == def.DefiLatitud &&
                    d.DefiLongitud == def.DefiLongitud &&
                    d.DefiDistHorizontal == def.DefiDistHorizontal &&
                    d.DefiDistVertical == def.DefiDistVertical &&
                    d.DefiDistTransversal == def.DefiDistTransversal &&
                    d.DefiObservacion == def.DefiObservacion
                );
            }

            return query
                .OrderByDescending(d => d.DefiInterno)
                .Select(d => d.DefiInterno)
                .FirstOrDefault();
        }

        public int DADEFI_GetLastInsertedId()
        {
            using var ctx = new SigreContext();
            return ctx.Deficiencias
                      .OrderByDescending(d => d.DefiInterno)
                      .Select(d => d.DefiInterno)
                      .First();
        }
        public bool DADEFI_SoftDelete(int x_defiInterno)
        {
            using (SigreContext ctx = new SigreContext())
            {
                // 1. Buscar el registro de la Deficiencia por ID
                var registro = ctx.Deficiencias
                                  .FirstOrDefault(d => d.DefiInterno == x_defiInterno);

                // Si no existe, retornamos false
                if (registro == null)
                {
                    return false;
                }

                // 2. Aplicar el Borrado Lógico a la Deficiencia
                registro.DefiActivo = false;
                registro.DefiFecModificacion = DateTime.Now;

                // --- NUEVO: 3. Buscar los archivos asociados a esta deficiencia ---
                // Basado en tu captura, validamos que ARCH_CodTabla sea el ID de la deficiencia
                // y opcionalmente que ARCH_Tabla sea "Deficiencias" para ser precisos.
                var archivosAsociados = ctx.Archivos
                                           .Where(a => a.ArchCodTabla == x_defiInterno
                                                    && a.ArchTabla == "Deficiencias")
                                           .ToList();

                // --- NUEVO: 4. Aplicar el Borrado Lógico a los archivos ---
                foreach (var archivo in archivosAsociados)
                {
                    archivo.ArchActivo = false; // Cambia "ArchActivo" por el nombre real de tu columna de estado
                                                // archivo.ArchFecModificacion = DateTime.Now; // Descomenta si también tienes esta columna en Archivos
                }

                // 5. Guardar cambios (EF Core hace un solo commit para la deficiencia y sus archivos)
                ctx.SaveChanges();

                return true;
            }
        }
        public int DADEFI_SaveOrUpdateWeb(Deficiencia input)
        {
            // 🚨 1. BLOQUE DE VALIDACIÓN ESTRICTA (FAIL-FAST) 🚨
            var errores = new List<string>();

            // 🔥 Solo exigimos Observación y Suministro si ES una falla real (TipiInterno > 0)
            if (input.TipiInterno > 0)
            {
                if (string.IsNullOrWhiteSpace(input.DefiObservacion))
                {
                    errores.Add("- La 'Observación' es obligatoria.");
                }

                if (string.IsNullOrWhiteSpace(input.DefiNumSuministro))
                {
                    errores.Add("- El 'Número de suministro' es obligatorio.");
                }
            }

            // C. Regla de Negocio: Tipificación y Criticidad
            if (input.TipiInterno == 0)
            {
                input.DefiEstadoCriticidad = 0;
                input.DefiObservacion = input.DefiObservacion ?? "";
                input.DefiNumSuministro = input.DefiNumSuministro ?? "";
            }
            else if (input.TipiInterno > 0 && input.DefiEstadoCriticidad <= 0)
            {
                errores.Add("- Debe seleccionar un nivel de 'Criticidad' válido.");
            }

            // -------------------------------------------------------
            // 🔥 2. REGLA DE EXCLUSIÓN MUTUA Y GUARDADO 🔥
            // -------------------------------------------------------
            using (var ctx = new SigreContext())
            {
                string codigoGis = input.DefiCodigoElemento?.Trim();

                if (!string.IsNullOrEmpty(codigoGis))
                {
                    var tipificacionesExistentes = ctx.Deficiencias
                        .Where(d => d.DefiCodigoElemento == codigoGis && d.DefiActivo == true && d.DefiInterno != input.DefiInterno)
                        .Select(d => d.TipiInterno)
                        .ToList();

                    bool tieneSinDeficiencia = tipificacionesExistentes.Any(t => t == 0);
                    bool tieneFallasReales = tipificacionesExistentes.Any(t => t > 0);

                    if (input.TipiInterno == 0 && tieneFallasReales)
                    {
                        errores.Add("- Acción bloqueada: No puede registrar 'SIN DEFICIENCIA'. Ya existen fallas reales para este elemento.");
                    }

                    if (input.TipiInterno > 0 && tieneSinDeficiencia)
                    {
                        errores.Add("- Acción bloqueada: No puede registrar la falla. El elemento está marcado como 'SIN DEFICIENCIA'.");
                    }

                    if (input.TipiInterno == 0 && tieneSinDeficiencia)
                    {
                        errores.Add("- Acción bloqueada: Ya existe un registro 'SIN DEFICIENCIA' para este elemento.");
                    }
                }

                if (errores.Any())
                {
                    throw new ArgumentException(string.Join("\n", errores));
                }

                // -------------------------------------------------------
                // 3. PROCESO NORMAL DE GUARDADO (Base de Datos)
                // -------------------------------------------------------

                Deficiencia existente = null;

                if (input.DefiInterno > 0)
                {
                    existente = ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == input.DefiInterno);
                }
                else if (!string.IsNullOrEmpty(input.DefiCol3))
                {
                    existente = ctx.Deficiencias.FirstOrDefault(d => d.DefiCol3 == input.DefiCol3);
                }

                if (existente != null)
                {
                    // 1. Detectamos qué cambió exactamente
                    string codigoGisOriginal = existente.DefiCodigoElemento?.Trim() ?? "";
                    string codigoGisNuevo = !string.IsNullOrWhiteSpace(input.DefiCodigoElemento) ? input.DefiCodigoElemento.Trim() : codigoGisOriginal;

                    bool cambioGis = codigoGisOriginal != codigoGisNuevo && !string.IsNullOrEmpty(codigoGisOriginal);
                    bool cambioTipi = existente.TipiInterno != input.TipiInterno;

                    // 🔥 LA REGLA DE ORO: Solo hacemos historial si cambia GIS o Tipificación
                    bool requiereHistorial = cambioGis || cambioTipi;

                    if (requiereHistorial)
                    {
                        // =======================================================
                        // RUTA A: CAMBIO ESTRUCTURAL (SOFT DELETE + NUEVO REGISTRO)
                        // =======================================================
                        using (var transaction = ctx.Database.BeginTransaction())
                        {
                            try
                            {
                                // 1. "Apagamos" el registro histórico
                                existente.DefiActivo = false;
                                existente.DefiFecModificacion = DateTime.Now;
                                existente.DefiUsuarioMod = !string.IsNullOrEmpty(input.DefiUsuarioMod) ? input.DefiUsuarioMod : "20";

                                // 2. Reciclamos el 'input' para que sea el nuevo registro
                                input.DefiInterno = 0; // Fuerza a la BD a insertarlo como nuevo
                                input.DefiActivo = true;
                                input.DefiEstado = "N";
                                input.DefiFecModificacion = DateTime.Now;

                                // 3. Heredamos los datos estructurales o aplicamos los nuevos si hubo cambio GIS
                                input.DefiCodigoElemento = codigoGisNuevo;
                                input.DefiTipoElemento = !string.IsNullOrWhiteSpace(input.DefiTipoElemento) ? input.DefiTipoElemento : existente.DefiTipoElemento;

                                // Rescatamos DefiCol2 para que no se pierda al clonar
                                input.DefiCol2 = !string.IsNullOrWhiteSpace(input.DefiCol2) ? input.DefiCol2.Trim().ToUpper() : (existente.DefiCol2 ?? "SEAL");

                                if (cambioGis)
                                {
                                    int nuevoIdPadre = 0;
                                    string tipoElementoEval = input.DefiTipoElemento?.ToUpper().Trim() ?? "";

                                    if (tipoElementoEval.StartsWith("POST"))
                                    {
                                        var poste = ctx.Postes.FirstOrDefault(p => p.PostCodigoNodo == codigoGisNuevo);
                                        if (poste != null) nuevoIdPadre = poste.PostInterno;
                                    }
                                    else if (tipoElementoEval.StartsWith("VANO"))
                                    {
                                        var vano = ctx.Vanos.FirstOrDefault(v => v.VanoCodigo == codigoGisNuevo);
                                        if (vano != null) nuevoIdPadre = vano.VanoInterno;
                                    }

                                    if (nuevoIdPadre == 0)
                                    {
                                        throw new ArgumentException($"- Acción bloqueada: El nuevo código GIS '{codigoGisNuevo}' no fue encontrado.");
                                    }

                                    input.DefiIdElemento = nuevoIdPadre;
                                }
                                else
                                {
                                    input.DefiIdElemento = existente.DefiIdElemento;
                                }

                                input.DefiCol3 = Guid.NewGuid().ToString();
                                input.DefiInspeccionado = existente.DefiInspeccionado;
                                input.DefiFechaCreacion = existente.DefiFechaCreacion;
                                input.DefiUsuarioInic = existente.DefiUsuarioInic;
                                input.DefiLatitud = input.DefiLatitud != 0 ? input.DefiLatitud : existente.DefiLatitud;
                                input.DefiLongitud = input.DefiLongitud != 0 ? input.DefiLongitud : existente.DefiLongitud;
                                input.DefiFecRegistro = input.DefiFecRegistro != DateTime.MinValue ? input.DefiFecRegistro : existente.DefiFecRegistro;

                                ctx.Deficiencias.Add(input);
                                ctx.SaveChanges();

                                // 🔥 TRASPASO AUTOMÁTICO DE ARCHIVOS 🔥
                                var archivosViejos = ctx.Archivos.Where(a => a.ArchCodTabla == existente.DefiInterno).ToList();
                                foreach (var arch in archivosViejos)
                                {
                                    arch.ArchCodTabla = input.DefiInterno;
                                    arch.DefiUUID = input.DefiCol3;
                                    if (cambioGis)
                                    {
                                        arch.ArchIdElemento = input.DefiIdElemento;
                                        arch.ArchTipoElemento = input.DefiTipoElemento;
                                    }
                                }
                                ctx.SaveChanges();
                                transaction.Commit();

                                return input.DefiInterno;
                            }
                            catch (Exception ex)
                            {
                                transaction.Rollback();
                                Exception realError = ex;
                                while (realError.InnerException != null) realError = realError.InnerException;
                                throw new Exception($"Error SQL Detallado: {realError.Message}");
                            }
                        }
                    }
                    //else
                    //{
                    //    // =======================================================
                    //    // RUTA B: ACTUALIZACIÓN SIMPLE DIRECTA (IN-PLACE UPDATE)
                    //    // =======================================================

                    //    // Actualizamos solo los atributos menores en la misma fila (No cambia ID)
                    //    existente.DefiCol2 = !string.IsNullOrWhiteSpace(input.DefiCol2) ? input.DefiCol2.Trim().ToUpper() : existente.DefiCol2;
                    //    existente.DefiObservacion = input.DefiObservacion;
                    //    existente.DefiComentario = input.DefiComentario;
                    //    existente.DefiEstadoCriticidad = input.DefiEstadoCriticidad;
                    //    existente.DefiNumSuministro = input.DefiNumSuministro;
                    //    existente.CodopInterno = input.CodopInterno;





                    //    existente.DefiLatitud = input.DefiLatitud != 0 ? input.DefiLatitud : existente.DefiLatitud;
                    //    existente.DefiLongitud = input.DefiLongitud != 0 ? input.DefiLongitud : existente.DefiLongitud;
                    //    // 🔥 Actualizamos la Fecha de Registro con la enviada desde el frontend
                    //    existente.DefiFecRegistro = input.DefiFecRegistro != DateTime.MinValue ? input.DefiFecRegistro : existente.DefiFecRegistro;

                    //    // 🔥 Hacemos que la Fecha de Creación sea igual a la Fecha de Registro editada
                    //    existente.DefiFechaCreacion = input.DefiFecRegistro != DateTime.MinValue ? input.DefiFecRegistro : existente.DefiFechaCreacion;

                    //    // 🔥 Mantenemos DefiFecModificacion con la fecha y hora REAL de este momento
                    //    // (Para saber a nivel de base de datos CUÁNDO alguien hizo esta edición)
                    //    existente.DefiFecModificacion = DateTime.Now;
                    //    existente.DefiUsuarioMod = !string.IsNullOrEmpty(input.DefiUsuarioMod) ? input.DefiUsuarioMod : "20";

                    //    ctx.SaveChanges();

                    //    return existente.DefiInterno; // Retornamos el mismo ID intacto
                    //}
                    else
                    {
                        // =======================================================
                        // RUTA B: ACTUALIZACIÓN SIMPLE DIRECTA (IN-PLACE UPDATE)
                        // =======================================================

                        // Actualizamos solo los atributos menores en la misma fila (No cambia ID)
                        existente.DefiCol2 = !string.IsNullOrWhiteSpace(input.DefiCol2) ? input.DefiCol2.Trim().ToUpper() : existente.DefiCol2;
                        existente.DefiObservacion = input.DefiObservacion;
                        existente.DefiComentario = input.DefiComentario;
                        existente.DefiEstadoCriticidad = input.DefiEstadoCriticidad;
                        existente.DefiNumSuministro = input.DefiNumSuministro;
                        existente.CodopInterno = input.CodopInterno;

                        // 🔥 CAMPOS TÉCNICOS QUE TAMBIÉN DEBEN ACTUALIZARSE EN EDICIÓN SIMPLE
                        existente.DefiDistHorizontal = input.DefiDistHorizontal;
                        existente.DefiDistVertical = input.DefiDistVertical;
                        existente.DefiAccesibilidad = input.DefiAccesibilidad;
                        existente.DefiTipoCruce = input.DefiTipoCruce;

                        existente.DefiLatitud = input.DefiLatitud != 0 ? input.DefiLatitud : existente.DefiLatitud;
                        existente.DefiLongitud = input.DefiLongitud != 0 ? input.DefiLongitud : existente.DefiLongitud;

                        // 🔥 Actualizamos la Fecha de Registro con la enviada desde el frontend
                        existente.DefiFecRegistro = input.DefiFecRegistro != DateTime.MinValue ? input.DefiFecRegistro : existente.DefiFecRegistro;

                        // 🔥 Hacemos que la Fecha de Creación sea igual a la Fecha de Registro editada
                        existente.DefiFechaCreacion = input.DefiFecRegistro != DateTime.MinValue ? input.DefiFecRegistro : existente.DefiFechaCreacion;

                        // 🔥 Mantenemos DefiFecModificacion con la fecha y hora REAL de este momento
                        // (Para saber a nivel de base de datos CUÁNDO alguien hizo esta edición)
                        existente.DefiFecModificacion = DateTime.Now;
                        existente.DefiUsuarioMod = !string.IsNullOrEmpty(input.DefiUsuarioMod) ? input.DefiUsuarioMod : "20";

                        ctx.SaveChanges();

                        return existente.DefiInterno; // Retornamos el mismo ID intacto
                    }
                }
                else
                {
                    // -------------------------------------------------------
                    // INSERCIÓN DE REGISTRO NUEVO
                    // -------------------------------------------------------
                    input.DefiInterno = 0;
                    input.DefiEstado = "N";
                    input.DefiActivo = true;
                    input.DefiInspeccionado = false;

                    var now = DateTime.Now;
                    input.DefiFecRegistro = input.DefiFecRegistro != DateTime.MinValue ? input.DefiFecRegistro : now;
                    input.DefiFechaCreacion = input.DefiFecRegistro;
                    input.DefiFecModificacion = now;

                    if (string.IsNullOrEmpty(input.DefiCol2)) input.DefiCol2 = "SEAL";
                    if (string.IsNullOrEmpty(input.DefiUsuarioInic)) input.DefiUsuarioInic = "20";
                    if (string.IsNullOrEmpty(input.DefiUsuarioMod)) input.DefiUsuarioMod = "20";
                    if (string.IsNullOrEmpty(input.DefiCol3)) input.DefiCol3 = Guid.NewGuid().ToString();

                    int idPadreEncontrado = 0;
                    codigoGis = input.DefiCodigoElemento != null ? input.DefiCodigoElemento.Trim() : "";
                    string tipoElemento = input.DefiTipoElemento != null ? input.DefiTipoElemento.ToUpper().Trim() : "";

                    if (tipoElemento.StartsWith("POST"))
                    {
                        var poste = ctx.Postes.FirstOrDefault(p => p.PostCodigoNodo == codigoGis);
                        if (poste != null) idPadreEncontrado = poste.PostInterno;
                    }
                    else if (tipoElemento.StartsWith("VANO"))
                    {
                        var vano = ctx.Vanos.FirstOrDefault(v => v.VanoCodigo == codigoGis);
                        if (vano != null) idPadreEncontrado = vano.VanoInterno;
                    }

                    input.DefiIdElemento = idPadreEncontrado;

                    ctx.Deficiencias.Add(input);
                    ctx.SaveChanges();
                    //SincronizarEstadoInspeccionElemento(input.DefiInterno);

                    return input.DefiInterno;
                }
            }
        }


        public object DADEFI_ObtenerReportePorSED(int sedInterno)
        {
            using (var ctx = new SigreContext())
            {
                // -----------------------------------------------------------------------------
                // PARTE A: POSTES
                // -----------------------------------------------------------------------------
                var dataPostes = (from d in ctx.Deficiencias
                                  join p in ctx.Postes on d.DefiCodigoElemento equals p.PostCodigoNodo
                                  where p.PostSubestacion == sedInterno
                                        && d.DefiActivo == true
                                  select new
                                  {
                                      Id = p.PostCodigoNodo,
                                      Sector = p.PostSubestacion,
                                      CodDef = d.TipiInterno,
                                      Criticidad = d.DefiEstadoCriticidad,
                                      // El estado individual de la deficiencia, controlado por el trigger
                                      Inspeccionado = d.DefiInspeccionado,
                                      CantidadArchivos = ctx.Archivos.Count(a => a.ArchCodTabla == d.DefiInterno && a.ArchActivo == true && a.ArchTipo != "0")
                                  })
                                  .ToList()
                                  .GroupBy(x => x.Id)
                                  .Select(g => new
                                  {
                                      id = g.Key,
                                      sector = g.FirstOrDefault()?.Sector.ToString() ?? "S/N",

                                      deficiencies = g.Select(x => x.CodDef).Distinct().ToList(),

                                      details = g.Select(x => new {
                                          code = x.CodDef,
                                          crit = x.Criticidad,
                                          inspeccionado = x.Inspeccionado,
                                          archivosActivos = x.CantidadArchivos
                                      }).ToList(),

                                      maxCriticality = g.Max(x => x.Criticidad ?? 0),
                                      totalArchivosPoste = g.Sum(x => x.CantidadArchivos),

                                      // 🔥 NUEVO: CÁLCULO DEL ESTADO DEL POSTE
                                      // Si CUALQUIER deficiencia del poste tiene Inspeccionado = false, el poste entero está Pendiente.
                                      estadoRevision = g.Any(x => !x.Inspeccionado) ? "PENDIENTE" : "COMPLETADO"
                                  }).ToList();

                // -----------------------------------------------------------------------------
                // PARTE B: VANOS
                // -----------------------------------------------------------------------------
                var dataVanos = (from d in ctx.Deficiencias
                                 join v in ctx.Vanos on d.DefiCodigoElemento equals v.VanoCodigo
                                 where v.VanoSubestacion == sedInterno
                                       && d.DefiActivo == true
                                 select new
                                 {
                                     Id = v.VanoCodigo,
                                     Sector = v.VanoSubestacion,
                                     CodDef = d.TipiInterno,
                                     Criticidad = d.DefiEstadoCriticidad,
                                     Inspeccionado = d.DefiInspeccionado,
                                     CantidadArchivos = ctx.Archivos.Count(a => a.ArchCodTabla == d.DefiInterno && a.ArchActivo == true && a.ArchTipo != "0")
                                 })
                                 .ToList()
                                 .GroupBy(x => x.Id)
                                 .Select(g => new
                                 {
                                     id = g.Key,
                                     sector = g.FirstOrDefault()?.Sector.ToString() ?? "S/N",

                                     deficiencies = g.Select(x => x.CodDef).Distinct().ToList(),

                                     details = g.Select(x => new {
                                         code = x.CodDef,
                                         crit = x.Criticidad,
                                         inspeccionado = x.Inspeccionado,
                                         archivosActivos = x.CantidadArchivos
                                     }).ToList(),

                                     maxCriticality = g.Max(x => x.Criticidad ?? 0),
                                     totalArchivosVano = g.Sum(x => x.CantidadArchivos),

                                     // 🔥 NUEVO: CÁLCULO DEL ESTADO DEL VANO
                                     estadoRevision = g.Any(x => !x.Inspeccionado) ? "PENDIENTE" : "COMPLETADO"
                                 }).ToList();

                return new { postes = dataPostes, vanos = dataVanos };
            }
        }
        public bool DADEFI_Restaurar(int x_defiInterno)
        {
            using (SigreContext ctx = new SigreContext())
            {
                // 1. Buscar el registro
                var registro = ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == x_defiInterno);

                if (registro == null) return false;

                // 2. Invertir el estado (De 0 a 1 / false a true)
                registro.DefiActivo = true;
                registro.DefiFecModificacion = DateTime.Now;

                // 3. Guardar
                ctx.SaveChanges();
                return true;
            }
        }

        public int DADEFI_GetDeficiencyIDByUUID(string x_defiCol3)
        {
            using (var ctx = new SigreContext())
            {
                var deficiency = ctx.Deficiencias
                                    .FirstOrDefault(d => d.DefiCol3 == x_defiCol3);
                return deficiency != null ? deficiency.DefiInterno : 0;
            }
        }

        public int DADEFI_GetDeficiencyIDByElementAndType(int x_idElemento, string x_tipoElemento, int x_tipiInterno)
        {
            using (var ctx = new SigreContext())
            {
                var deficiency = ctx.Deficiencias
                                    .FirstOrDefault(d => d.DefiIdElemento == x_idElemento
                                                      && d.DefiTipoElemento == x_tipoElemento
                                                      && d.TipiInterno == x_tipiInterno);
                return deficiency != null ? deficiency.DefiInterno : 0;
            }
        }
        // Método NUEVO y EXCLUSIVO para traer deficiencias + estado de terceros
        public List<Deficiencia> DADEFI_GetBySed_ConEstadoTerceros(int x_sed)
        {
            using (var ctx = new SigreContext())
            {
                var resultadoFinal = new List<Deficiencia>();

                // ---------------------------------------------------------
                // 1. BUSCAR EN POSTES (Usando Join para velocidad máxima)
                // ---------------------------------------------------------
                var queryPostes = from d in ctx.Deficiencias
                                  join p in ctx.Postes on d.DefiIdElemento equals p.PostInterno
                                  where d.DefiTipoElemento == "POST"
                                     && p.PostSubestacion == x_sed // Filtro por SED en el padre
                                  select new
                                  {
                                      Deficiencia = d,
                                      // Convertimos el 1/0 a true/false aquí mismo
                                      EsTercero = p.PostTerceros
                                  };

                // Ejecutamos y mapeamos
                foreach (var item in queryPostes.ToList())
                {
                    // Llenamos la propiedad virtual
                    item.Deficiencia.EsTercero = item.EsTercero;
                    resultadoFinal.Add(item.Deficiencia);
                }

                // ---------------------------------------------------------
                // 2. BUSCAR EN VANOS
                // ---------------------------------------------------------
                var queryVanos = from d in ctx.Deficiencias
                                 join v in ctx.Vanos on d.DefiIdElemento equals v.VanoInterno
                                 where d.DefiTipoElemento == "VANO"
                                    && v.VanoSubestacion == x_sed
                                 select new
                                 {
                                     Deficiencia = d,
                                     EsTercero = v.VanoTerceros
                                 };

                foreach (var item in queryVanos.ToList())
                {
                    item.Deficiencia.EsTercero = item.EsTercero;
                    resultadoFinal.Add(item.Deficiencia);
                }

                return resultadoFinal;
            }
        }
        // Método para cambiar el estado "Tercero" del ELEMENTO PADRE (Poste/Vano)
        // usando el ID de la Deficiencia como referencia.
        public bool DADEFI_CambiarEstadoTerceroDesdeDeficiencia(int x_defiInterno, bool x_esTercero)
        {
            using (var ctx = new SigreContext())
            {
                // 1. Buscamos la deficiencia (Esto no falla porque la tabla Deficiencias está bien)
                var deficiencia = ctx.Deficiencias
                                     .Select(d => new { d.DefiInterno, d.DefiTipoElemento, d.DefiIdElemento }) // Proyectamos solo lo necesario para evitar errores en otras columnas
                                     .FirstOrDefault(d => d.DefiInterno == x_defiInterno);

                if (deficiencia == null || deficiencia.DefiIdElemento == null)
                {
                    return false;
                }

                int filasAfectadas = 0;
                int valorBit = x_esTercero ? 1 : 0; // Convertimos bool a 1 o 0 para SQL

                // 2. Si es POSTE -> SQL Directo
                if (deficiencia.DefiTipoElemento == "POST")
                {
                    // Ejecutamos UPDATE directo ignorando el resto de columnas
                    filasAfectadas = ctx.Database.ExecuteSqlRaw(
                        "UPDATE Postes SET POST_Terceros = {0} WHERE POST_Interno = {1}",
                        valorBit,
                        deficiencia.DefiIdElemento
                    );
                }
                // 3. Si es VANO -> SQL Directo (Aquí evitamos el error de VANO_Tramo)
                else if (deficiencia.DefiTipoElemento == "VANO")
                {
                    // Al escribir el SQL a mano, nunca mencionamos VANO_Tramo, así que no fallará
                    filasAfectadas = ctx.Database.ExecuteSqlRaw(
                        "UPDATE Vanos SET VANO_Terceros = {0} WHERE VANO_Interno = {1}",
                        valorBit,
                        deficiencia.DefiIdElemento
                    );
                }

                return filasAfectadas > 0;
            }
        }

        public DataTable DADEFI_GetDeficienciasBySedsDT(List<int> sedInternos)
        {
            using var ctx = new SigreContext();

            // 🔹 Consulta completa
            var list =
            (
                from d in ctx.Deficiencias.AsNoTracking()

                join p in ctx.Postes on d.DefiIdElemento equals p.PostInterno into pj
                from p in pj.DefaultIfEmpty()

                join v in ctx.Vanos on d.DefiIdElemento equals v.VanoInterno into vj
                from v in vj.DefaultIfEmpty()

                where
                    (d.DefiTipoElemento == "POST" && sedInternos.Contains((int)p.PostSubestacion)) ||
                    (d.DefiTipoElemento == "VANO" && sedInternos.Contains((int)v.VanoSubestacion))

                select d   // 🔥 TODA la entidad
            ).ToList();     // 🔥 UNA SOLA QUERY

            // 🔹 Crear DataTable completo
            var dt = new DataTable();

            dt.Columns.Add("DEFI_Interno", typeof(int));
            dt.Columns.Add("DEFI_Estado", typeof(string));
            dt.Columns.Add("INSP_Interno", typeof(int));
            dt.Columns.Add("TABL_Interno", typeof(int));
            dt.Columns.Add("DEFI_CodigoElemento", typeof(string));
            dt.Columns.Add("TIPI_Interno", typeof(int));
            dt.Columns.Add("DEFI_NumSuministro", typeof(string));
            dt.Columns.Add("DEFI_FechaDenuncia", typeof(DateTime));
            dt.Columns.Add("DEFI_FechaInspeccion", typeof(DateTime));
            dt.Columns.Add("DEFI_FechaSubsanacion", typeof(DateTime));
            dt.Columns.Add("DEFI_Observacion", typeof(string));
            dt.Columns.Add("DEFI_EstadoSubsanacion", typeof(int));
            dt.Columns.Add("DEFI_Latitud", typeof(double));
            dt.Columns.Add("DEFI_Longitud", typeof(double));
            dt.Columns.Add("DEFI_TipoElemento", typeof(string));
            dt.Columns.Add("DEFI_DistHorizontal", typeof(double));
            dt.Columns.Add("DEFI_DistVertical", typeof(double));
            dt.Columns.Add("DEFI_DistTransversal", typeof(double));
            dt.Columns.Add("DEFI_IdElemento", typeof(int));
            dt.Columns.Add("DEFI_FecRegistro", typeof(DateTime));
            dt.Columns.Add("DEFI_CodDef", typeof(string));
            dt.Columns.Add("DEFI_CodRes", typeof(int));
            dt.Columns.Add("DEFI_CodDen", typeof(int));
            dt.Columns.Add("DEFI_Refer1", typeof(string));
            dt.Columns.Add("DEFI_Refer2", typeof(string));
            dt.Columns.Add("DEFI_CoordX", typeof(double));
            dt.Columns.Add("DEFI_CoordY", typeof(double));
            dt.Columns.Add("DEFI_CodAMT", typeof(int));
            dt.Columns.Add("DEFI_NroOrden", typeof(int));
            dt.Columns.Add("DEFI_PointX", typeof(double));
            dt.Columns.Add("DEFI_PointY", typeof(double));
            dt.Columns.Add("DEFI_UsuCre", typeof(string));
            dt.Columns.Add("DEFI_UsuNPC", typeof(string));
            dt.Columns.Add("DEFI_FecModificacion", typeof(DateTime));
            dt.Columns.Add("DEFI_FechaCreacion", typeof(DateTime));
            dt.Columns.Add("DEFI_TipoMaterial", typeof(string));
            dt.Columns.Add("DEFI_NodoInicial", typeof(string));
            dt.Columns.Add("DEFI_NodoFinal", typeof(string));
            dt.Columns.Add("DEFI_TipoRetenida", typeof(string));
            dt.Columns.Add("DEFI_RetenidaMaterial", typeof(string));
            dt.Columns.Add("DEFI_TipoArmado", typeof(string));
            dt.Columns.Add("DEFI_ArmadoMaterial", typeof(string));
            dt.Columns.Add("DEFI_NumPostes", typeof(int));
            dt.Columns.Add("DEFI_PozoTierra", typeof(int));
            dt.Columns.Add("DEFI_Responsable", typeof(string));
            dt.Columns.Add("DEFI_Comentario", typeof(string));
            dt.Columns.Add("DEFI_PozoTierra2", typeof(int));
            dt.Columns.Add("DEFI_UsuarioInic", typeof(string));
            dt.Columns.Add("DEFI_UsuarioMod", typeof(string));
            dt.Columns.Add("DEFI_Activo", typeof(int));
            dt.Columns.Add("DEFI_EstadoCriticidad", typeof(int));
            dt.Columns.Add("DEFI_Inspeccionado", typeof(int));
            dt.Columns.Add("DEFI_KeyWords", typeof(string));
            dt.Columns.Add("DEFI_Col1", typeof(string));
            dt.Columns.Add("DEFI_Col2", typeof(string));
            dt.Columns.Add("DEFI_Col3", typeof(string)); // UUID
            //dt.Columns.Add("DEFI_Accesibilidad", typeof(int));
            //dt.Columns.Add("DEFI_TipoCruce", typeof(string));

            // 🔹 Cargar datos
            foreach (var d in list)
            {
                dt.Rows.Add(
                    d.DefiInterno,
                    d.DefiEstado,
                    d.InspInterno,
                    d.TablInterno,
                    d.DefiCodigoElemento,
                    d.TipiInterno,
                    d.DefiNumSuministro,
                    d.DefiFechaDenuncia,
                    d.DefiFechaInspeccion,
                    d.DefiFechaSubsanacion,
                    d.DefiObservacion,
                    d.DefiEstadoSubsanacion,
                    d.DefiLatitud,
                    d.DefiLongitud,
                    d.DefiTipoElemento,
                    d.DefiDistHorizontal,
                    d.DefiDistVertical,
                    d.DefiDistTransversal,
                    d.DefiIdElemento,
                    d.DefiFecRegistro,
                    d.DefiCodDef,
                    d.DefiCodRes,
                    d.DefiCodDen,
                    d.DefiRefer1,
                    d.DefiRefer2,
                    d.DefiCoordX,
                    d.DefiCoordY,
                    d.DefiCodAmt,
                    d.DefiNroOrden,
                    d.DefiPointX,
                    d.DefiPointY,
                    d.DefiUsuCre,
                    d.DefiUsuNpc,
                    d.DefiFecModificacion,
                    d.DefiFechaCreacion,
                    d.DefiTipoMaterial,
                    d.DefiNodoInicial,
                    d.DefiNodoFinal,
                    d.DefiTipoRetenida,
                    d.DefiRetenidaMaterial,
                    d.DefiTipoArmado,
                    d.DefiArmadoMaterial,
                    d.DefiNumPostes,
                    d.DefiPozoTierra,
                    d.DefiResponsable,
                    d.DefiComentario,
                    d.DefiPozoTierra2,
                    d.DefiUsuarioInic,
                    d.DefiUsuarioMod,
                    d.DefiActivo,
                    d.DefiEstadoCriticidad,
                    d.DefiInspeccionado,
                    d.DefiKeyWords,
                    d.DefiCol1,
                    d.DefiCol2,
                    d.DefiCol3
                    //d.DefiAccesibilidad,
                    //d.DefiTipoCruce
                );
            }

            return dt;
        }



        // EN DADeficiency.cs
        public async Task<object> DADEFI_GetInfoTecnicaAsync(string codigo)
        {
            using (var ctx = new SigreContext())
            {
                // PASO 1: Descubrir el TIPO consultando la tabla Deficiencias
                // Buscamos cualquier registro asociado a ese código para ver qué es (POST o VANO)
                var tipoElemento = await ctx.Deficiencias
                                            .Where(d => d.DefiCodigoElemento == codigo)
                                            .Select(d => d.DefiTipoElemento)
                                            .FirstOrDefaultAsync();

                // Si no existe en deficiencias, no podemos saber qué es (o retornamos null)
                if (string.IsNullOrEmpty(tipoElemento)) return null;

                // PASO 2: Consultar la tabla técnica correspondiente según el tipo descubierto
                if (tipoElemento == "POST")
                {
                    return await ctx.Postes
                        .Where(p => p.PostCodigoNodo == codigo)
                        .Select(p => new
                        {
                            Material = p.PostMaterial,
                            TipoRetenida = p.PostRetenidaTipo,
                            Tercero = p.PostTerceros,
                            Altura = p.PostAltura,
                            Tipo = "POSTE"
                        })
                        .FirstOrDefaultAsync();
                }
                else if (tipoElemento == "VANO")
                {
                    return await ctx.Vanos
                        .Where(v => v.VanoCodigo == codigo)
                        .Select(v => new
                        {
                            // En Vanos usualmente no mostramos altura, pero sí nodos
                            NodoInicial = v.VanoNodoInicial,
                            NodoFinal = v.VanoNodoFinal,
                            Material = v.VanoMaterial, // Si tienes esta columna
                            Tercero = v.VanoTerceros,
                            Tipo = "VANO"
                        })
                        .FirstOrDefaultAsync();
                }

                return null;
            }
        }
        public async Task<bool> DADEFI_ActualizarFichaTecnicaAsync(UpdateFichaTecnicaDto datos)
        {
            using (var ctx = new SigreContext())
            {
                // 1. Declaramos y obtenemos 'deficiencia' DENTRO del using
                var deficiencia = await ctx.Deficiencias
                    .Where(d => d.DefiInterno == datos.DefiInterno)
                    .Select(d => new { d.DefiTipoElemento, d.DefiIdElemento })
                    .FirstOrDefaultAsync();

                // 2. Validamos que exista
                if (deficiencia == null || deficiencia.DefiIdElemento == null) return false;

                int filasAfectadas = 0;
                int bitTercero = datos.EsTercero ? 1 : 0;

                // 3. Lógica de seguridad para el ID de Retenida
                int idRetenidaSeguro = 5;
                if (datos.TipoRetenida.HasValue && datos.TipoRetenida.Value >= 1 && datos.TipoRetenida.Value <= 5)
                {
                    idRetenidaSeguro = datos.TipoRetenida.Value;
                }

                // 4. Usamos 'deficiencia' aquí (ahora sí existe en el contexto)
                if (deficiencia.DefiTipoElemento == "POST")
                {
                    filasAfectadas = await ctx.Database.ExecuteSqlRawAsync(
                        @"UPDATE Postes 
                  SET POST_Material = {0}, 
                      POST_Altura = {1}, 
                      POST_RetenidaTipo = {2},  
                      POST_Terceros = {3} 
                  WHERE POST_Interno = {4}",
                        datos.Material,
                        datos.Altura,
                        idRetenidaSeguro,
                        bitTercero,
                        deficiencia.DefiIdElemento
                    );
                }
                else if (deficiencia.DefiTipoElemento == "VANO")
                {
                    filasAfectadas = await ctx.Database.ExecuteSqlRawAsync(
                       @"UPDATE Vanos 
                  SET VANO_Terceros = {0}, 
                      VANO_NodoInicial = {1}, 
                      VANO_NodoFinal = {2} 
                  WHERE VANO_Interno = {3}",
                       bitTercero,
                       datos.NodoInicial,
                       datos.NodoFinal,
                       deficiencia.DefiIdElemento
                   );
                }

                return filasAfectadas > 0;
            }
        }

        public async Task<object> ObtenerDeficienciasDelDiaPaginadoAsync(int skip, int take, DateTime fechaBusqueda)
        {
            using (var ctx = new SigreContext())
            {
                DateTime inicioDia = fechaBusqueda.Date; // 00:00:00 del día solicitado
                DateTime finDia = inicioDia.AddDays(1);  // 00:00:00 del día siguiente

                // 1. Armamos la consulta base con exactamente los mismos filtros del día
                var query = ctx.Deficiencias
                    .AsNoTracking()
                    .Where(d => d.DefiFechaCreacion >= inicioDia && d.DefiFechaCreacion < finDia && d.DefiActivo == true);

                // 2. Contamos el total real de registros del día (Ej: los 10,984). 
                // Esto servirá para tu Indicador Rojo y para la paginación de PrimeReact.
                int totalRecords = await query.CountAsync();

                // 3. Traemos solo el pedacito que React nos pide (Ej: los primeros 10)
                var data = await query
                    .OrderByDescending(d => d.DefiInterno) // Las más recientes de hoy primero
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                // 4. Devolvemos un objeto anónimo con el total y la data
                return new { totalRecords, data };
            }
        }
        public async Task<object> ObtenerEstadisticasInspectoresDelDiaAsync(DateTime fechaBusqueda)
        {
            using (var ctx = new SigreContext())
            {
                DateTime inicioDia = fechaBusqueda.Date; // 00:00:00 del día solicitado
                DateTime finDia = inicioDia.AddDays(1);  // 00:00:00 del día siguiente

                // La base de datos hará toda la matemática súper rápido
                var estadisticas = await ctx.Deficiencias
                    .AsNoTracking()
                    // 1. FILTRAMOS ESTRICTAMENTE POR EL DÍA
                    .Where(d => d.DefiFechaCreacion >= inicioDia && d.DefiFechaCreacion < finDia && d.DefiActivo == true)
                    // 2. AGRUPAMOS POR INSPECTOR
                    .GroupBy(d => d.DefiUsuarioInic)
                    .Select(g => new
                    {
                        IdInspector = g.Key,
                        // Contamos cuántos son POST y cuántos son VANO
                        Postes = g.Count(x => x.DefiTipoElemento == "POST"),
                        Vanos = g.Count(x => x.DefiTipoElemento == "VANO"),
                        Total = g.Count()
                    })
                    .OrderByDescending(e => e.Total) // Ordenamos del más trabajador al menor
                    .ToListAsync();

                return estadisticas;
            }
        }
        public void ReevaluarEstadoInspeccionDeficiencia(int defiInterno)
        {
            if (defiInterno <= 0) return;

            using (var ctx = new SigreContext())
            {
                // 1. Los tipos obligatorios que mencionaste
                var tiposRequeridos = new[] { "1", "2", "3", "4" };

                // 2. Contamos cuántas fotos VÁLIDAS tiene esta deficiencia actualmente
                int cantidadFotosValidas = ctx.Archivos
                    .Count(a => a.ArchCodTabla == defiInterno
                             && a.ArchActivo == true
                             && tiposRequeridos.Contains(a.ArchTipo));

                // 3. Regla de negocio: Al menos 4 fotos
                bool nuevoEstadoInspeccionado = cantidadFotosValidas >= 4;

                // 4. Actualizamos SOLO si hubo un cambio de estado
                var deficiencia = ctx.Deficiencias.Find(defiInterno);
                if (deficiencia != null && deficiencia.DefiInspeccionado != nuevoEstadoInspeccionado)
                {
                    deficiencia.DefiInspeccionado = nuevoEstadoInspeccionado;
                    deficiencia.DefiFecModificacion = DateTime.Now;

                    // Si la deficiencia pasa a false, aseguramos un rastro de auditoría
                    if (!nuevoEstadoInspeccionado)
                    {
                        deficiencia.DefiUsuarioMod = "20";
                    }

                    ctx.SaveChanges();
                }
            }
        }
        public void SincronizarEstadoInspeccionElemento(int defiInterno)
        {
            using (var ctx = new SigreContext())
            {
                // 1. Obtener la deficiencia actual y sus datos de vinculación
                var deficienciaActual = ctx.Deficiencias.Find(defiInterno);
                if (deficienciaActual == null) return;

                string codigoGis = deficienciaActual.DefiCodigoElemento;
                string tipo = deficienciaActual.DefiTipoElemento?.ToUpper() ?? "";

                // 2. REGLA DE ORO: Un elemento solo está "COMPLETADO" si 
                // NO tiene ninguna deficiencia activa en estado 'false' (0)
                bool todoInspeccionado = !ctx.Deficiencias
                    .Any(d => d.DefiCodigoElemento == codigoGis
                           && d.DefiActivo == true
                           && d.DefiInspeccionado == false); // Buscamos si falta alguna

                // 3. Actualizar la tabla correspondiente
                if (tipo.Contains("POST"))
                {
                    var poste = ctx.Postes.FirstOrDefault(p => p.PostCodigoNodo == codigoGis);
                    if (poste != null)
                    {
                        // Actualizamos la columna en la tabla Postes
                        poste.PostInspeccionado = todoInspeccionado;
                    }
                }
                else if (tipo.Contains("VANO"))
                {
                    var vano = ctx.Vanos.FirstOrDefault(v => v.VanoCodigo == codigoGis);
                    if (vano != null)
                    {
                        // Actualizamos vanoInspeccionado que vimos en tu respuesta JSON
                        vano.VanoInspeccionado = todoInspeccionado;
                    }
                }

                ctx.SaveChanges();
            }
        }
        public DashboardEstadisticasDTO DADEFI_GetEstadisticasCalidad(int sedInterno, string sedCodigo)
        {
            using (var ctx = new SigreContext())
            {
                // ==============================================================================
                // 1. OBTENER DATOS BASE OPTIMIZADOS
                // Quitamos "d.DefiActivo == true" de aquí para poder contar los Eliminados luego
                // ==============================================================================

                var queryPostes = from d in ctx.Deficiencias
                                  join p in ctx.Postes on d.DefiIdElemento equals p.PostInterno
                                  where d.DefiTipoElemento == "POST" && p.PostSubestacion == sedInterno
                                  select new
                                  {
                                      d.DefiInterno,
                                      d.DefiCodigoElemento,
                                      d.TipiInterno,
                                      d.DefiEstadoCriticidad,
                                      d.DefiInspeccionado,
                                      d.DefiNumSuministro,
                                      d.DefiFecRegistro,
                                      d.DefiActivo,
                                      d.DefiDistHorizontal,
                                      d.DefiDistVertical,
                                      EsTercero = p.PostTerceros,
                                      NodoIni = "",
                                      NodoFin = ""
                                  };

                var queryVanos = from d in ctx.Deficiencias
                                 join v in ctx.Vanos on d.DefiIdElemento equals v.VanoInterno
                                 where d.DefiTipoElemento == "VANO" && v.VanoSubestacion == sedInterno
                                 select new
                                 {
                                     d.DefiInterno,
                                     d.DefiCodigoElemento,
                                     d.TipiInterno,
                                     d.DefiEstadoCriticidad,
                                     d.DefiInspeccionado,
                                     d.DefiNumSuministro,
                                     d.DefiFecRegistro,
                                     d.DefiActivo,
                                     d.DefiDistHorizontal,
                                     d.DefiDistVertical,
                                     EsTercero = v.VanoTerceros,
                                     NodoIni = v.VanoNodoInicial,
                                     NodoFin = v.VanoNodoFinal
                                 };

                // 🔥 CORRECCIÓN CRÍTICA: Usar .Concat() en lugar de .Union() para no perder duplicados
                var todasDeficiencias = queryPostes.Concat(queryVanos).ToList();

                // Extraemos solo las activas para los KPIs donde no importan las eliminadas
                var deficienciasActivas = todasDeficiencias.Where(d => d.DefiActivo == true).ToList();

                var dto = new DashboardEstadisticasDTO();

                // ==============================================================================
                // 2. CÁLCULO DE MÉTRICAS (En Memoria)
                // ==============================================================================

                // --- A. Resumen General (Activos vs Eliminados Lógicos) ---
                // Ahora sí podemos contarlos porque trajimos todos
                int totalActivos = todasDeficiencias.Count(d => d.DefiActivo == true);
                int totalEliminados = todasDeficiencias.Count(d => d.DefiActivo == false);

                dto.SummaryData = new List<ResumenEliminadosDTO>
        {
            new ResumenEliminadosDTO { Sed = sedCodigo, Eliminado = "NO", Total = totalActivos },
            new ResumenEliminadosDTO { Sed = sedCodigo, Eliminado = "SI", Total = totalEliminados }
        };
                dto.TotalGeneral = totalActivos + totalEliminados;


                // --- B. Alertas de Calidad (KPIs) ---

                // 1. No Inspeccionados (Sobre las activas)
                dto.NoInspeccionados = deficienciasActivas.Count(d => d.DefiInspeccionado == false || d.DefiInspeccionado == null);

                // 2. Deficiencias Duplicadas
                dto.Duplicadas = deficienciasActivas
                    .Where(d => d.TipiInterno > 0)
                    .GroupBy(d => new { d.DefiCodigoElemento, d.TipiInterno })
                    .Where(g => g.Count() > 1)
                    .Sum(g => g.Count() - 1);

                // 3. Sin Deff con Deff
                var agrupadoPorElemento = deficienciasActivas.GroupBy(d => d.DefiCodigoElemento);
                dto.SinDefConDef = agrupadoPorElemento.Count(g => g.Any(d => d.TipiInterno == 0) && g.Any(d => d.TipiInterno > 0));

                // 4. Nodo Inicial/Final Faltante (Solo aplica a Vanos, excluyendo terceros)
                dto.NodoFaltante = ctx.Vanos
                    .Where(v => v.VanoSubestacion == sedInterno && (v.VanoTerceros == false || v.VanoTerceros == null))
                    .Count(v => string.IsNullOrEmpty(v.VanoNodoInicial) || string.IsNullOrEmpty(v.VanoNodoFinal));

                // 5. Salto de Fechas
                DateTime fechaMinima = new DateTime(2000, 1, 1);
                DateTime fechaMaxima = DateTime.Now.AddDays(1);
                dto.SaltoFechas = deficienciasActivas.Count(d => d.DefiFecRegistro < fechaMinima || d.DefiFecRegistro > fechaMaxima);

                // 6. Número de Suministro Erróneo 
                dto.SuministroErroneo = deficienciasActivas.Count(d => d.TipiInterno > 0 && string.IsNullOrEmpty(d.DefiNumSuministro));

                // 7. Deficiencia sin Criticidad
                dto.SinCriticidad = deficienciasActivas.Count(d => d.TipiInterno > 0 && (d.DefiEstadoCriticidad == null || d.DefiEstadoCriticidad == 0));

                // 8. Distancias en 0.00
                
                int id7004 = 48;
                int id7006 = 49;
                dto.DistanciasCero = deficienciasActivas.Count(d =>
                    (d.TipiInterno == id7004 || d.TipiInterno == id7006) &&
                    (d.DefiDistHorizontal == 0 || d.DefiDistVertical == 0)
                );

                // 9. Criticidad Leve
                dto.CriticidadLeve = deficienciasActivas.Count(d => d.DefiEstadoCriticidad == 1);

                return dto;
            }
        }


        public async Task<int> DADEFI_ClonarWeb(int idDeficienciaOriginal, int nuevaTipificacion, string nuevoCodigoTipi, string usuarioSesion)
        {
            using (var ctx = new SigreContext())
            using (var transaction = ctx.Database.BeginTransaction())
            {
                try
                {
                    var original = ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == idDeficienciaOriginal);
                    if (original == null) throw new Exception("La deficiencia original no existe.");

                    // 🔥 NUEVO CANDADO 1: Prohibido usar un "Sin Deficiencia" como molde para clonar
                    if (original.TipiInterno == 0)
                    {
                        throw new ArgumentException("No está permitido clonar un registro de 'SIN DEFICIENCIA'.");
                    }

                    // 2. VALIDACIONES ESTRICTAS Y REGLAS DE NEGOCIO
                    var tipificacionesExistentes = ctx.Deficiencias
                        .Where(d => d.DefiCodigoElemento == original.DefiCodigoElemento && d.DefiActivo == true)
                        .Select(d => d.TipiInterno).ToList();

                    bool tieneFallasReales = tipificacionesExistentes.Any(t => t > 0);
                    bool tieneSinDeficiencia = tipificacionesExistentes.Any(t => t == 0);

                    // Reglas cruzadas que ya tenías
                    if (nuevaTipificacion == 0 && tieneFallasReales)
                        throw new ArgumentException("No puede clonar como 'SIN DEFICIENCIA'. Ya existen fallas reales.");

                    if (nuevaTipificacion > 0 && tieneSinDeficiencia)
                        throw new ArgumentException("El elemento está marcado como 'SIN DEFICIENCIA'.");

                    // 🔥 NUEVO CANDADO 2: Prohibido clonar hacia un nuevo "Sin Deficiencia" si el poste ya tiene uno
                    if (nuevaTipificacion == 0 && tieneSinDeficiencia)
                    {
                        throw new ArgumentException("Ya existe un registro 'SIN DEFICIENCIA' para este elemento. Solo puede haber uno.");
                    }

                    // 3. CREAR EL CLON (Base de Datos)
                    var clonDefi = new Deficiencia
                    {
                        // 🔥 HEREDAMOS TODO (Reflejo exacto del padre)
                        DefiCodigoElemento = original.DefiCodigoElemento,
                        DefiTipoElemento = original.DefiTipoElemento,
                        DefiIdElemento = original.DefiIdElemento,
                        TablInterno = original.TablInterno, // <- EL CAMPO VITAL
                        DefiLatitud = original.DefiLatitud,
                        DefiLongitud = original.DefiLongitud,
                        DefiObservacion = original.DefiObservacion,
                        DefiComentario = original.DefiComentario,
                        DefiNumSuministro = original.DefiNumSuministro,
                        DefiEstadoCriticidad = original.DefiEstadoCriticidad,
                        DefiDistHorizontal = original.DefiDistHorizontal,
                        DefiDistVertical = original.DefiDistVertical,
                        DefiAccesibilidad = original.DefiAccesibilidad,
                        DefiTipoCruce = original.DefiTipoCruce,
                        CodopInterno = original.CodopInterno,
                        DefiCol1 = original.DefiCol1,
                        DefiCol2 = original.DefiCol2,
                        DefiUsuarioInic = original.DefiUsuarioInic,
                        // Fechas originales conservadas
                        DefiFechaCreacion = original.DefiFechaCreacion,
                        DefiFecRegistro = original.DefiFecRegistro,
                        DefiInspeccionado = original.DefiInspeccionado,
                        // 🔥 APLICAMOS LOS CAMBIOS PROPIOS DEL CLON
                        TipiInterno = nuevaTipificacion,
                        DefiCol3 = Guid.NewGuid().ToString(), // UUID Nuevo para que no choque
                        DefiInterno = 0, // 0 = Registro Nuevo
                        DefiEstado = "N",
                        DefiActivo = true,

                        DefiUsuarioMod = usuarioSesion,
                        DefiFecModificacion = DateTime.Now
                    };

                        switch (nuevoCodigoTipi)
                    {
                        case "7004":
                            // 7004 usa Accesibilidad, Horizontal y Vertical. Solo sobra TipoCruce.
                            clonDefi.DefiTipoCruce = null;
                            break;

                        case "7006":
                            // 7006 usa TipoCruce y Vertical. Sobra Accesibilidad y Horizontal.
                            clonDefi.DefiAccesibilidad = null;
                            clonDefi.DefiDistHorizontal = null;
                            break;

                        case "7008":
                            // 7008 usa solo Horizontal. Sobra todo lo demás.
                            clonDefi.DefiAccesibilidad = null;
                            clonDefi.DefiTipoCruce = null;
                            clonDefi.DefiDistVertical = null;
                            break;

                        default:
                            // Para 6002, 6026 y todas las demás (que no usan estos campos), limpiamos todo.
                            clonDefi.DefiAccesibilidad = null;
                            clonDefi.DefiTipoCruce = null;
                            clonDefi.DefiDistHorizontal = null;
                            clonDefi.DefiDistVertical = null;
                            break;
                    
                };

                    ctx.Deficiencias.Add(clonDefi);
                    ctx.SaveChanges(); // Guardamos para obtener el nuevo DefiInterno

                    

                    // 🔥 1. LÓGICA DE CARPETAS ESPECIALES (Cálculo del Molde)
                    string codeNuevoFolder = nuevoCodigoTipi;
                    string codeNuevoFile = nuevoCodigoTipi;

                    if (nuevoCodigoTipi == "0" || nuevoCodigoTipi == "SINDEF")
                    {
                        codeNuevoFolder = "SINDEF";
                        codeNuevoFile = "0000";
                    }
                    else if (nuevoCodigoTipi == "7004")
                    {
                        // Buscamos cuántas deficiencias 7004 tiene este poste para sacar el correlativo
                        var defs7004 = ctx.Deficiencias
                            .Where(d => d.DefiCodigoElemento == original.DefiCodigoElemento && d.TipiInterno == nuevaTipificacion && d.DefiActivo == true)
                            .OrderBy(d => d.DefiInterno)
                            .ToList();

                        // Encontramos qué posición ocupa nuestro clon (que ya fue guardado en la BD arriba)
                        int index = defs7004.FindIndex(d => d.DefiInterno == clonDefi.DefiInterno);
                        int folderNum = index != -1 ? index + 1 : (defs7004.Count > 0 ? defs7004.Count : 1);

                        codeNuevoFolder = $"7004/{folderNum}";
                        codeNuevoFile = $"7004_{folderNum}";
                    }

                    // 4. CLONAR ARCHIVOS (Base de Datos + Físico)
                    var archivosOriginales = ctx.Archivos.Where(a => a.ArchCodTabla == idDeficienciaOriginal && a.ArchActivo == true).ToList();
                    var daFile = new DAFile();

                    foreach (var arch in archivosOriginales)
                    {
                        System.Diagnostics.Debug.WriteLine($"🔍 ARCHIVO ORIG: ID={arch.ArchInterno} | Fecha={arch.ArchFecha}");

                        string nuevaRutaFisica = arch.ArchNombre;
                        string elemCodigo = original.DefiCodigoElemento; // Ej: "VBT000262999"

                        // 🔥 2. EXTRACCIÓN INTELIGENTE DE LA RUTA VIEJA
                        // Como no sabemos si la original era 7006, 6026 o 7004/1, lo extraemos directo del string
                        string folderPadre = $"/{elemCodigo}/";
                        int startIdx = arch.ArchNombre.IndexOf(folderPadre, StringComparison.OrdinalIgnoreCase);

                        if (startIdx >= 0)
                        {
                            startIdx += folderPadre.Length;
                            int endIdx = arch.ArchNombre.LastIndexOf('/');
                            string codeViejoFolder = arch.ArchNombre.Substring(startIdx, endIdx - startIdx); // Ej saca: "7006" o "7004/1"

                            // Ahora extraemos la parte del nombre del archivo (Ej: "7006" o "7004_1")
                            string oldFileName = Path.GetFileName(arch.ArchNombre);
                            string marker = $"-{elemCodigo}-";
                            int markerIdx = oldFileName.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
                            string codeViejoFile = "";

                            if (markerIdx >= 0)
                            {
                                markerIdx += marker.Length;
                                int nextDashIdx = oldFileName.IndexOf('-', markerIdx);
                                if (nextDashIdx >= 0)
                                {
                                    codeViejoFile = oldFileName.Substring(markerIdx, nextDashIdx - markerIdx);
                                }
                            }

                            // 🔥 3. REEMPLAZO QUIRÚRGICO
                            // Reemplazamos exactamente la carpeta y exactamente el nombre de archivo
                            if (!string.IsNullOrEmpty(codeViejoFolder))
                                nuevaRutaFisica = nuevaRutaFisica.Replace($"/{elemCodigo}/{codeViejoFolder}/", $"/{elemCodigo}/{codeNuevoFolder}/");

                            if (!string.IsNullOrEmpty(codeViejoFile))
                                nuevaRutaFisica = nuevaRutaFisica.Replace($"-{elemCodigo}-{codeViejoFile}-", $"-{elemCodigo}-{codeNuevoFile}-");
                        }

                        if (arch.ArchNombre == nuevaRutaFisica) continue;

                        // 🔥 LA MAGIA RESCATADORA AQUÍ 🔥
                        // Extraemos la ruta real (por si la BD tiene el formato sucio 7004.X.Y)
                        // Como instanciaste 'daFile' unas líneas arriba, usamos esa misma instancia
                        // Extraemos la ruta resiliente
                        string rutaViejaReal = daFile.ObtenerRutaFisicaReal(arch.ArchNombre);

                        // Le decimos a C# que continúe si a pesar de los rescates, el archivo no existe en el disco
                        if (!File.Exists(Path.Combine(daFile._baseDirectory, rutaViejaReal.Replace("/", "\\"))))
                        {
                            continue;
                        }

                        // Clonamos
                        bool seCopioConExito = await daFile.CopiarArchivoFisicoAsync(rutaViejaReal, nuevaRutaFisica);

                       

                        if (seCopioConExito)
                        {
                            var clonArch = new Archivo
                            {
                                ArchCodTabla = clonDefi.DefiInterno,
                                ArchTabla = "Deficiencias",
                                DefiUUID = clonDefi.DefiCol3,
                                ArchNombre = nuevaRutaFisica,
                                TipiInterno = nuevaTipificacion,
                                ArchTipo = arch.ArchTipo,
                                ArchLatitud = arch.ArchLatitud,
                                ArchLongitud = arch.ArchLongitud,
                                ArchIdElemento = arch.ArchIdElemento,
                                ArchTipoElemento = arch.ArchTipoElemento,
                                ArchActivo = true,
                                ArchFecha = arch.ArchFecha // <-- Si la BD sigue pisando esto, revisa tus Triggers de SQL
                            };

                            System.Diagnostics.Debug.WriteLine($"📝 CLON PRE-SAVE: Fecha={clonArch.ArchFecha}");
                            ctx.Archivos.Add(clonArch);
                        }
                    }

                    ctx.SaveChanges();
                    transaction.Commit();

                    return clonDefi.DefiInterno; // Retornamos el ID de la nueva deficiencia
                }
                catch (Exception ex)
                {
                    // 🔥 AQUÍ SÍ VA EL TRUCO SENIOR
                    transaction.Rollback();

                    // Escarbar hasta encontrar el error exacto de SQL Server
                    Exception realError = ex;
                    while (realError.InnerException != null)
                    {
                        realError = realError.InnerException;
                    }

                    // Esto se lo enviamos al controlador, y el controlador a React
                    throw new Exception(realError.Message);
                }
            }
        }
    }
}
