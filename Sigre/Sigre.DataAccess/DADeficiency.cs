using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities.Structs;
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
                     DefiEstadoOffLine = 0,
                 }).ToList();

            return deficiencies;
        }

        public List<PinStruct> DADEFI_GetPinsByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();

            Alimentadore alim = ctx.Alimentadores.SingleOrDefault(a => a.AlimInterno == x_feeder_id);

            var query = ctx.Deficiencias.Where(d => d.DefiCodAmt == alim.AlimCodigo).Select(p => new PinStruct() { 
                Id = 0,
                IdAlimentador = alim.AlimInterno,
                Label = "",
                Type = ElectricElement.Deficiency,
                Latitude = p.DefiLatitud,
                Longitude = p.DefiLongitud
                
            });

            return query.ToList();  
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
                 DefiEstadoOffLine = 0,
             });

            return query.ToList();
        }

        public List<DeficiencyDto> DADEFI_GetByListFeeders(int? feeder1, int? feeder2, int? feeder3)
        {
            SigreContext ctx = new SigreContext();

            var deficiencias = ctx.DeficiencyDto
                                    .FromSqlRaw("EXEC dbo.sp_GetDeficienciasByFeeders @Feeder1, @Feeder2, @Feeder3",
                                        new SqlParameter("@Feeder1", (object)feeder1 ?? DBNull.Value),
                                        new SqlParameter("@Feeder2", (object)feeder2 ?? DBNull.Value),
                                        new SqlParameter("@Feeder3", (object)feeder3 ?? DBNull.Value)
                                    ).ToList();

            return deficiencias;
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
    }
}
