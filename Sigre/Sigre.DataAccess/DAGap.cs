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
    public class DAGap
    {
        public List<Vano> DAGAP_GetByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();
            var vanos = ctx.Vanos.Where(v => v.AlimInterno == x_feeder_id).Select(van =>
            new Vano()
            {
                AlimInterno = van.AlimInterno,
                AlimInternoNavigation = van.AlimInternoNavigation,
                VanoCodigo = van.VanoCodigo,
                VanoEtiqueta = van.VanoEtiqueta,
                VanoInspeccionado = van.VanoInspeccionado,
                VanoInterno = van.VanoInterno,
                VanoLatitudFin = van.VanoLatitudFin,
                VanoLatitudIni = van.VanoLatitudIni,
                VanoLongitudFin = van.VanoLongitudFin,
                VanoLongitudIni = van.VanoLongitudIni,
                VanoMaterial = van.VanoMaterial == null? "ALU" : van.VanoMaterial,
                VanoNodoFinal = van.VanoNodoFinal,
                VanoNodoInicial = van.VanoNodoInicial,
                VanoTerceros = van.VanoTerceros,
                VanoTramo = van.VanoTramo,
            }
            );
            return vanos.ToList();
        }

        public List<Vano> DAGAP_GetByListFeeder(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();

            var vanos = ctx.Vanos.Where(v => x_feeders.Contains(v.AlimInterno)).ToList();

            return vanos;
        }

        public List<Vano> DAGAP_GetByListSeds(List<int> x_seds)
        {
            SigreContext ctx = new SigreContext();

            var vanos = ctx.Vanos.Where(v => x_seds.Contains((int)v.VanoSubestacion)).ToList();

            return vanos;
        }

        //0-> Baja Tension, 1 -> Media Tension
        public List<Vano> DAGAP_GetByProject(List<int> x_ids, int x_project)
        {
            if (x_project == 0)
                return DAGAP_GetByListSeds(x_ids);
            else
                return DAGAP_GetByListFeeder(x_ids);
        }



        public List<PinStruct> DAGAP_GetPinsByFeeders(List<int> x_feeders)
        {
            SigreContext ctx = new SigreContext();

            List<PinStruct> pinVanos = ctx.Vanos.Where(v => x_feeders.Contains(v.AlimInterno)).Select(v => new PinStruct()
            {
                Id = v.VanoInterno,
                IdAlimentador = v.AlimInterno,
                Label = "",
                Type = ElectricElement.Gap,
                NodoInicial = v.VanoNodoInicial,
                NodoFinal = v.VanoNodoFinal,
                Inspeccionado = v.VanoInspeccionado,
                IdSed = v.VanoSubestacion
            }).ToList();

            return pinVanos;
        }

        public List<PinStruct> DAGAP_GetPinsBySubestacion(List<int> x_subestaciones)
        {
            using (var ctx = new SigreContext())
            {
                var pinVanos = ctx.Vanos
                    .Where(v => x_subestaciones.Contains((int)v.VanoSubestacion ) && v.VanoTerceros == false)
                    .Select(v => new PinStruct()
                    {
                        Id = v.VanoInterno,
                        IdAlimentador = v.AlimInterno,
                        Label = "",
                        Type = ElectricElement.Gap,
                        NodoInicial = v.VanoNodoInicial,
                        NodoFinal = v.VanoNodoFinal,
                        Inspeccionado = v.VanoInspeccionado,
                        IdSed = (int)v.VanoSubestacion
                    }).ToList();

                return pinVanos;
            }
        }

        //0-> Baja Tension, 1 -> Media Tension
        public List<PinStruct> DAGAP_GetPins(List<int> x_ids, int proyecto)
        {
            if (proyecto == 0)
                return DAGAP_GetPinsBySubestacion(x_ids);
            else
                return DAGAP_GetPinsByFeeders(x_ids);
        }

        public List<(int localId, int serverId)> DAVANO_SyncFromSQLite( List<VanoSyncDto> vanosOffline)
        {
            using var ctx = new SigreContext();
            var resultado = new List<(int, int)>();

            foreach (var dto in vanosOffline)
            {
                // 🔹 INSERT
                if (dto.EstadoOffLine == 2)
                {
                    var nuevo = new Vano
                    {
                        VanoCodigo = dto.VanoCodigo,
                        VanoLatitudIni = dto.VanoLatitudIni,
                        VanoLongitudIni = dto.VanoLongitudIni,
                        VanoLatitudFin = dto.VanoLatitudFin,
                        VanoLongitudFin = dto.VanoLongitudFin,
                        AlimInterno = dto.AlimInterno,
                        VanoEtiqueta = dto.VanoEtiqueta,
                        VanoTerceros = dto.VanoTerceros,
                        VanoMaterial = dto.VanoMaterial,
                        VanoNodoInicial = dto.VanoNodoInicial,
                        VanoNodoFinal = dto.VanoNodoFinal,
                        VanoInspeccionado = dto.VanoInspeccionado,
                        VanoSubestacion = dto.VanoSubestacion,
                        VanoEsMt = dto.VanoEsMt,
                        VanoEsBt = dto.VanoEsBt,
                        VanoTramo = dto.VanoTramo,
                    };

                    ctx.Vanos.Add(nuevo);
                    ctx.SaveChanges();

                    resultado.Add((dto.VanoInterno ?? 0, nuevo.VanoInterno));
                }
                // 🔹 UPDATE
                else if ((dto.EstadoOffLine == 1 || dto.EstadoOffLine == 0)
                         && dto.VanoInterno.HasValue)
                {
                    var existente = ctx.Vanos
                        .FirstOrDefault(v => v.VanoInterno == dto.VanoInterno.Value);

                    if (existente == null)
                        continue;

                    existente.VanoCodigo = dto.VanoCodigo;
                    existente.VanoLatitudIni = dto.VanoLatitudIni;
                    existente.VanoLongitudIni = dto.VanoLongitudIni;
                    existente.VanoLatitudFin = dto.VanoLatitudFin;
                    existente.VanoLongitudFin = dto.VanoLongitudFin;
                    existente.VanoEtiqueta = dto.VanoEtiqueta;
                    existente.VanoTerceros = dto.VanoTerceros;
                    existente.VanoMaterial = dto.VanoMaterial;
                    existente.VanoNodoInicial = dto.VanoNodoInicial;
                    existente.VanoNodoFinal = dto.VanoNodoFinal;
                    existente.VanoInspeccionado = dto.VanoInspeccionado;
                    existente.VanoEsMt = dto.VanoEsMt;
                    existente.VanoEsBt = dto.VanoEsBt;
                    existente.VanoTramo = dto.VanoTramo;

                    ctx.SaveChanges();

                    resultado.Add((existente.VanoInterno, existente.VanoInterno));
                }
            }

            return resultado;
        }
        // En DataAccess/DAGap.cs

        public object DAGAP_GetGapsBySubestacion(int idSed)
        {
            using (var ctx = new SigreContext())
            {
                var query = ctx.Vanos
                    .Where(v => v.VanoSubestacion == idSed && v.VanoTerceros == false)
                    .Select(v => new
                    {
                        Id = v.VanoInterno,
                        Code = v.VanoCodigo,

                        Lat1 = v.VanoLatitudIni,
                        Lon1 = v.VanoLongitudIni,
                        Lat2 = v.VanoLatitudFin,
                        Lon2 = v.VanoLongitudFin,

                        Type = "Gap",
                        Inspeccionado = v.VanoInspeccionado
                    });

                return query.ToList();
            }
        }
        public int DAVANO_GuardarWeb(Vano x_vano)
        {
            try
            {
                using (var ctx = new SigreContext())
                {
                    // === 0. VALIDACIÓN DE DUPLICADOS ===
                    if (!string.IsNullOrEmpty(x_vano.VanoCodigo))
                    {
                        bool yaExiste = ctx.Vanos.Any(v =>
                            v.VanoCodigo == x_vano.VanoCodigo &&
                            v.VanoInterno != x_vano.VanoInterno // Ignoramos al vano actual si estamos editando
                        );

                        if (yaExiste)
                        {
                            throw new Exception($"El Código GIS '{x_vano.VanoCodigo}' ya existe en la base de datos.");
                        }
                    }
                    // CASO 1: INSERTAR (Nuevo)
                    if (x_vano.VanoInterno == 0)
                    {
                        // Configuración inicial para nuevos
                        x_vano.VanoInspeccionado = false;
                        x_vano.VanoEsBt = true;
                        x_vano.VanoEsMt = null;

                        ctx.Vanos.Add(x_vano);
                        ctx.SaveChanges();
                        return x_vano.VanoInterno;
                    }

                    // CASO 2: ACTUALIZAR (Edición)
                    else
                    {
                        // Buscamos el original en la BD
                        var existente = ctx.Vanos.FirstOrDefault(v => v.VanoInterno == x_vano.VanoInterno);

                        if (existente == null)
                            throw new Exception($"El Vano con ID {x_vano.VanoInterno} no existe para editar.");

                        // Mapeo Manual (Más seguro que automapper aquí):
                        // Solo actualizamos lo que el formulario permite cambiar.

                        existente.VanoEtiqueta = x_vano.VanoEtiqueta;
                        existente.VanoCodigo = x_vano.VanoCodigo;

                        // Geometría
                        existente.VanoLatitudIni = x_vano.VanoLatitudIni;
                        existente.VanoLongitudIni = x_vano.VanoLongitudIni;
                        existente.VanoLatitudFin = x_vano.VanoLatitudFin;
                        existente.VanoLongitudFin = x_vano.VanoLongitudFin;

                        // Relaciones
                        existente.AlimInterno = x_vano.AlimInterno;
                        existente.VanoSubestacion = x_vano.VanoSubestacion;

                        // Datos Técnicos
                        existente.VanoTerceros = x_vano.VanoTerceros;
                        existente.VanoMaterial = x_vano.VanoMaterial;
                        existente.VanoNodoInicial = x_vano.VanoNodoInicial;
                        existente.VanoNodoFinal = x_vano.VanoNodoFinal;

                        // NO TOCAMOS: VanoInspeccionado (para no perder si ya se inspeccionó)

                        ctx.SaveChanges();
                        return existente.VanoInterno;
                    }
                }
            }
            catch (Exception ex)
            {
                var mensaje = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                throw new Exception($"ERROR SQL VANO: {mensaje}");
            }
        }
    }
}
