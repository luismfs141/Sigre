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
                     DefiAccesibilidad = d.DefiAccesibilidad,
                     DefiTipoCruce = d.DefiTipoCruce,
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

        public List<(int localId, int serverId)> DADefi_SyncFromSQLite(
    List<DeficienciaSyncDto> deficienciasOffline)
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
                    existente.DefiFecModificacion = DateTime.Now;

                    existente.DefiAccesibilidad = dto.DefiAccesibilidad;
                    existente.DefiTipoCruce = dto.DefiTipoCruce;
                    existente.DefiActivo = dto.DefiActivo;

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
                DefiNroOrden = def_offline.DefiNroOrden
            };
        }
        //public int DADEFI_ExistDeficiency(string codElemento, string tipoElemento, int tipiInterno)
        //{
        //    SigreContext ctx = new SigreContext();

        //    Deficiencia deficiencia = ctx.Deficiencias.SingleOrDefault(d => d.DefiCodigoElemento == codElemento && d.DefiTipoElemento == tipoElemento && d.TipiInterno == tipiInterno);

        //    if (deficiencia is not null)
        //    {
        //        return deficiencia.DefiInterno;
        //    }
        //    else
        //    {
        //        return 0;
        //    }
        //}
        public Deficiencia DADEFI_ExistDeficiency(string codigoUnico)
        {
            if (string.IsNullOrWhiteSpace(codigoUnico))
                return null;

            using var ctx = new SigreContext();

            return ctx.Deficiencias
                      .AsNoTracking()
                      .FirstOrDefault(d => d.DefiCol3 == codigoUnico);
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

                    // Actualizar ubicación solo si viene válida (distinta de 0)
                    if (input.DefiLatitud != 0) existente.DefiLatitud = input.DefiLatitud;
                    if (input.DefiLongitud != 0) existente.DefiLongitud = input.DefiLongitud;

                    // Auditoría
                    existente.DefiFecModificacion = DateTime.Now;
                    // Usamos el usuario que viene o un default
                    existente.DefiUsuarioMod = !string.IsNullOrEmpty(input.DefiUsuarioMod) ? input.DefiUsuarioMod : "WEB_USER";

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

                    // Usuarios (Evitar NULLs)
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
    }
}
