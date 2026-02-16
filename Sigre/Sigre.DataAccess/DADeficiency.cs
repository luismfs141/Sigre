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

        public List<(int localId, int serverId)> DADefi_SyncFromSQLite(List<DeficienciaSyncDto> deficienciasOffline)
        {
            using var ctx = new SigreContext();
            var resultado = new List<(int, int)>();

            foreach (var dto in deficienciasOffline)
            {
                if (string.IsNullOrWhiteSpace(dto.DefiCol3))
                    continue; // seguridad mínima

                // 🔍 BUSCAR POR IDENTIFICADOR ÚNICO
                var existente = ctx.Deficiencias
                    .FirstOrDefault(d => d.DefiCol3 == dto.DefiCol3);

                // ==========================
                // 🔁 UPDATE
                // ==========================
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
                    existente.DefiActivo = dto.DefiActivo;

                    existente.DefiCol2 = dto.DefiCol2;

                    ctx.SaveChanges();
                    resultado.Add((dto.DefiInterno, existente.DefiInterno));
                }
                // ==========================
                // ➕ INSERT
                // ==========================
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
                    };

                    ctx.Deficiencias.Add(nueva);
                    ctx.SaveChanges();

                    resultado.Add((dto.DefiInterno, nueva.DefiInterno));
                }
            }

            return resultado;
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
                DefiCol1 = def_offline.DefiCol1 
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
                // 1. Buscar el registro por ID
                var registro = ctx.Deficiencias
                                  .FirstOrDefault(d => d.DefiInterno == x_defiInterno);

                // Si no existe, retornamos false
                if (registro == null)
                {
                    return false;
                }
                // 2. Aplicar el Borrado Lógico
                registro.DefiActivo = false;

                registro.DefiFecModificacion = DateTime.Now;


                // 4. Guardar cambios
                ctx.SaveChanges();

                return true;
            }
        }
        public int DADEFI_SaveOrUpdateWeb(Deficiencia input)
        {
            using (var ctx = new SigreContext())
            {
                Deficiencia existente = null;

                // -------------------------------------------------------
                // 1. LÓGICA DE BÚSQUEDA (ID > UUID)
                // -------------------------------------------------------
                if (input.DefiInterno > 0)
                {
                    // Prioridad 1: Búsqueda por ID (Edición Web)
                    existente = ctx.Deficiencias.FirstOrDefault(d => d.DefiInterno == input.DefiInterno);
                }
                else if (!string.IsNullOrEmpty(input.DefiCol3))
                {
                    // Prioridad 2: Búsqueda por UUID (Sincronización/Seguridad)
                    existente = ctx.Deficiencias.FirstOrDefault(d => d.DefiCol3 == input.DefiCol3);
                }

                // -------------------------------------------------------
                // 2. ACTUALIZACIÓN (UPDATE)
                // -------------------------------------------------------
                if (existente != null)
                {
                    // Mapeamos SOLO los campos editables para no borrar datos del sistema
                    existente.DefiObservacion = input.DefiObservacion;
                    existente.DefiComentario = input.DefiComentario;
                    existente.DefiNumSuministro = input.DefiNumSuministro;
                    existente.DefiEstadoCriticidad = input.DefiEstadoCriticidad;

                    // Datos Técnicos
                    existente.DefiDistHorizontal = input.DefiDistHorizontal;
                    existente.DefiDistVertical = input.DefiDistVertical;
                    existente.DefiAccesibilidad = input.DefiAccesibilidad;
                    existente.DefiTipoCruce = input.DefiTipoCruce;
                    existente.DefiCol2 = input.DefiCol2;
                    // Actualizar ubicación solo si viene válida (distinta de 0)
                    if (input.DefiLatitud != 0) existente.DefiLatitud = input.DefiLatitud;

                    if (input.DefiLongitud != 0) existente.DefiLongitud = input.DefiLongitud;
                    if (input.DefiFecRegistro != DateTime.MinValue)
                    {
                        existente.DefiFecRegistro = input.DefiFecRegistro;
                        existente.DefiFechaCreacion = input.DefiFecRegistro;
                    }
                    // Auditoría
                    
                    existente.DefiFecModificacion = DateTime.Now;
                    // Usamos el usuario que viene o un default
                    existente.DefiUsuarioMod = !string.IsNullOrEmpty(input.DefiUsuarioMod) ? input.DefiUsuarioMod : "WEB_USER";
                    existente.DefiInspeccionado = input.DefiInspeccionado;
                    ctx.SaveChanges();
                    return existente.DefiInterno; // Retornamos ID existente
                }

                // -------------------------------------------------------
                // 3. INSERCIÓN (INSERT)
                // -------------------------------------------------------
                else
                {
                    // Asignar valores por defecto obligatorios (Constraints SQL)
                    input.DefiInterno = 0; // Resetear para IDENTITY
                    input.DefiEstado = "N"; // Siempre 'N'ueva
                    input.DefiActivo = true; // bit 1
                    input.DefiInspeccionado = false; // bit 0

                    // Fechas
                    var now = DateTime.Now;
                    input.DefiFecRegistro = input.DefiFecRegistro != DateTime.MinValue ? input.DefiFecRegistro : now;
                    if (input.DefiInterno == 0)
                    {
                        input.DefiFechaCreacion = input.DefiFecRegistro;
                    }
                    input.DefiFecModificacion = now;
                    input.DefiInspeccionado = true;
                    // Usuarios (Evitar NULLs)
                    if (string.IsNullOrEmpty(input.DefiCol2))
                    {
                        input.DefiCol2 = "SEAL"; 
                    }
                    if (string.IsNullOrEmpty(input.DefiUsuarioInic)) input.DefiUsuarioInic = "WEB_USER";
                    if (string.IsNullOrEmpty(input.DefiUsuarioMod)) input.DefiUsuarioMod = "WEB_USER";

                    // UUID (Si no viene, lo generamos)
                    if (string.IsNullOrEmpty(input.DefiCol3)) input.DefiCol3 = Guid.NewGuid().ToString();

                    ctx.Deficiencias.Add(input);
                    ctx.SaveChanges();

                    return input.DefiInterno; // Retornamos nuevo ID
                }
            }
        }
        // DADeficiency.cs

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
                                      Sector = p.PostSubestacion, // Esto es un INT (ej: 8143)
                                      CodDef = d.TipiInterno
                                  })
                                  .ToList()
                                  .GroupBy(x => x.Id)
                                  .Select(g => new
                                  {
                                      id = g.Key,
                                      // CORRECCIÓN AQUÍ: Convertimos a String explícitamente
                                      sector = g.FirstOrDefault()?.Sector.ToString() ?? "S/N",
                                      deficiencies = g.Select(x => x.CodDef).Distinct().ToList()
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
                                     Sector = v.VanoSubestacion, // Esto es un INT
                                     CodDef = d.TipiInterno
                                 })
                                 .ToList()
                                 .GroupBy(x => x.Id)
                                 .Select(g => new
                                 {
                                     id = g.Key,
                                     // CORRECCIÓN AQUÍ: Convertimos a String explícitamente
                                     sector = g.FirstOrDefault()?.Sector.ToString() ?? "S/N",
                                     deficiencies = g.Select(x => x.CodDef).Distinct().ToList()
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
    }
}
