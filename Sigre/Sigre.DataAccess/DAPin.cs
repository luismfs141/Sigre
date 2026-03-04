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
                // =================================================================================
                // 1. OBTENER POSTES BASE (Ultra rápido)
                // Traemos solo las columnas necesarias para armar el Pin
                // =================================================================================
                var postesBD = ctx.Postes
                    .Where(p => p.PostSubestacion == idSed)
                    .Select(p => new
                    {
                        p.PostInterno,
                        p.PostEtiqueta,
                        p.PostLatitud,
                        p.PostLongitud,
                        p.PostCodigoNodo,
                        p.AlimInterno,
                        p.PostInspeccionado,
                        p.PostTerceros,
                        p.PostSubestacion
                    }).ToList();

                // =================================================================================
                // 2. OBTENER MÉTRICAS DE DEFICIENCIAS Y FOTOS EN BLOQUE
                // Cruzamos deficiencias con postes de esta SED y contamos los archivos
                // =================================================================================
                var deficienciasPostes = (from d in ctx.Deficiencias
                                          join p in ctx.Postes on d.DefiCodigoElemento equals p.PostCodigoNodo
                                          where p.PostSubestacion == idSed && d.DefiActivo == true
                                          select new
                                          {
                                              CodigoNodo = d.DefiCodigoElemento,
                                              Inspeccionado = d.DefiInspeccionado,
                                              // Contamos cuántos archivos válidos tiene ESTA deficiencia
                                              CantidadArchivos = ctx.Archivos.Count(a => a.ArchCodTabla == d.DefiInterno && a.ArchActivo == true && a.ArchTipo != "0")
                                          }).ToList();

                // Agrupamos en RAM usando el Código GIS (Nodo) como llave para búsqueda instantánea O(1)
                var defsAgrupadasPorNodo = deficienciasPostes
                    .GroupBy(x => x.CodigoNodo)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // =================================================================================
                // 3. MAPEO FINAL Y REGLA DE NEGOCIO (Las 4 Fotos)
                // =================================================================================
                var result = postesBD.Select(p =>
                {
                    // Estado por defecto (en caso de que el poste no tenga ninguna deficiencia registrada)
                    bool estadoFinalCompletado = p.PostInspeccionado;

                    // Si el poste tiene deficiencias, aplicamos la regla estricta
                    if (defsAgrupadasPorNodo.ContainsKey(p.PostCodigoNodo))
                    {
                        var defsDelPoste = defsAgrupadasPorNodo[p.PostCodigoNodo];

                        // REGLA 1: Todas las deficiencias de este poste deben estar marcadas como Inspeccionadas
                        bool todasInspeccionadas = defsDelPoste.All(d => d.Inspeccionado == true);

                        // REGLA 2: TODAS las deficiencias deben tener al menos 4 fotos
                        bool cumplenFotos = defsDelPoste.All(d => d.CantidadArchivos >= 4);

                        // El poste solo está completado si cumple ambas reglas en su totalidad
                        estadoFinalCompletado = todasInspeccionadas && cumplenFotos;
                    }

                    return new PinStruct()
                    {
                        Id = p.PostInterno,
                        Label = p.PostEtiqueta,
                        Latitude = p.PostLatitud ?? 0,
                        Longitude = p.PostLongitud ?? 0,
                        Type = ElectricElement.Post,
                        ElementCode = p.PostCodigoNodo,
                        IdAlimentador = p.AlimInterno,

                        // 🔥 AQUÍ SE INYECTA EL CÁLCULO ESTRICTO
                        Inspeccionado = estadoFinalCompletado,

                        Tercero = p.PostTerceros,
                        IdSed = p.PostSubestacion
                    };
                }).ToList();

                return result;
            }
        }
    }
}
