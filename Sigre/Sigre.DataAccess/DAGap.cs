using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
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

            var vanos = ctx.Vanos
                .Where(v => v.AlimInterno == x_feeder_id)
                .Select(van => new Vano()
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
                    VanoMaterial = van.VanoMaterial == null ? "ALU" : van.VanoMaterial,
                    VanoNodoFinal = van.VanoNodoFinal,
                    VanoNodoInicial = van.VanoNodoInicial,
                    VanoTerceros = van.VanoTerceros,
                    VanoTramo = van.VanoTramo,
                    VanoSubestacion = van.VanoSubestacion,
                    VanoEsBt = van.VanoEsBt,
                    VanoEsMt = van.VanoEsMt,
                    EsgoInterno = van.EsgoInterno
                });

            return vanos.ToList();
        }

        public List<Vano> DAGAP_GetByListFeeder(List<int> x_feeders)
        {
            using var ctx = new SigreContext();

            return ctx.Vanos
                .AsNoTracking()
                .Where(v => x_feeders.Contains(v.AlimInterno))
                .ToList();
        }

        public List<Vano> DAGAP_GetByListSeds(List<int> x_seds)
        {
            using var ctx = new SigreContext();

            return ctx.Vanos
                .AsNoTracking()
                .Where(v => x_seds.Contains((int)v.VanoSubestacion))
                .ToList();
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
            using var ctx = new SigreContext();

            return ctx.Vanos
                .AsNoTracking()
                .Where(v => x_feeders.Contains(v.AlimInterno))
                .Select(v => new PinStruct()
                {
                    Id = v.VanoInterno,
                    IdAlimentador = v.AlimInterno,
                    Label = "",
                    Type = ElectricElement.Gap,
                    NodoInicial = v.VanoNodoInicial,
                    NodoFinal = v.VanoNodoFinal,
                    Inspeccionado = v.VanoInspeccionado,
                    IdSed = v.VanoSubestacion
                })
                .ToList();
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

        public List<(int localId, int serverId)> DAVANO_SyncFromSQLite(List<VanoSyncDto> vanosOffline)
        {
            using var ctx = new SigreContext();

            if (vanosOffline == null || vanosOffline.Count == 0)
                return new List<(int localId, int serverId)>();

            using var tx = ctx.Database.BeginTransaction();

            try
            {
                var mappings = new List<(int localId, Vano entity)>();

                foreach (var dto in vanosOffline)
                {
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
                            EsgoInterno = dto.EsgoInterno
                        };

                        ctx.Vanos.Add(nuevo);
                        mappings.Add((dto.VanoInternoLocal > 0 ? dto.VanoInternoLocal : (dto.VanoInterno ?? 0), nuevo));
                    }
                    else if (dto.EstadoOffLine == 1 || dto.EstadoOffLine == 0)
                    {
                        if (!dto.VanoInterno.HasValue || dto.VanoInterno.Value <= 0)
                            throw new Exception("Vano UPDATE sin VanoInterno válido.");

                        var existente = ctx.Vanos.FirstOrDefault(v => v.VanoInterno == dto.VanoInterno.Value);
                        if (existente == null)
                            throw new Exception($"No existe el vano {dto.VanoInterno.Value} para actualizar.");

                        existente.VanoCodigo = dto.VanoCodigo;
                        existente.VanoLatitudIni = dto.VanoLatitudIni;
                        existente.VanoLongitudIni = dto.VanoLongitudIni;
                        existente.VanoLatitudFin = dto.VanoLatitudFin;
                        existente.VanoLongitudFin = dto.VanoLongitudFin;
                        existente.AlimInterno = dto.AlimInterno;
                        existente.VanoEtiqueta = dto.VanoEtiqueta;
                        existente.VanoTerceros = dto.VanoTerceros;
                        existente.VanoMaterial = dto.VanoMaterial;
                        existente.VanoNodoInicial = dto.VanoNodoInicial;
                        existente.VanoNodoFinal = dto.VanoNodoFinal;
                        existente.VanoInspeccionado = dto.VanoInspeccionado;
                        existente.VanoSubestacion = dto.VanoSubestacion;
                        existente.VanoEsMt = dto.VanoEsMt;
                        existente.VanoEsBt = dto.VanoEsBt;
                        existente.VanoTramo = dto.VanoTramo;
                        existente.EsgoInterno = dto.EsgoInterno;

                        mappings.Add((dto.VanoInterno.Value, existente));
                    }
                    else
                    {
                        throw new Exception($"EstadoOffLine no soportado para Vano: {dto.EstadoOffLine}");
                    }
                }

                ctx.SaveChanges();
                tx.Commit();

                return mappings
                    .Select(x => (x.localId, x.entity.VanoInterno))
                    .ToList();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }
        // En DataAccess/DAGap.cs

        public object DAGAP_GetGapsBySubestacion(int idSed)
        {
            using (var ctx = new SigreContext())
            {
                // =================================================================================
                // 1. OBTENER VANOS BASE (Ultra rápido)
                // Traemos solo la geometría y datos básicos
                // =================================================================================
                var vanosBD = ctx.Vanos
                    .Where(v => v.VanoSubestacion == idSed && v.VanoTerceros == false)
                    .Select(v => new
                    {
                        v.VanoInterno,
                        v.VanoCodigo,
                        v.VanoLatitudIni,
                        v.VanoLongitudIni,
                        v.VanoLatitudFin,
                        v.VanoLongitudFin,
                        v.VanoInspeccionado
                    }).ToList();

                // =================================================================================
                // 2. OBTENER MÉTRICAS DE DEFICIENCIAS Y FOTOS EN BLOQUE (Solo para esta SED)
                // =================================================================================
                var deficienciasVanos = (from d in ctx.Deficiencias
                                         join v in ctx.Vanos on d.DefiCodigoElemento equals v.VanoCodigo
                                         where v.VanoSubestacion == idSed
                                               && d.DefiActivo == true
                                               && v.VanoTerceros == false
                                         select new
                                         {
                                             CodigoNodo = d.DefiCodigoElemento,
                                             Inspeccionado = d.DefiInspeccionado,
                                             // Contamos cuántos archivos válidos tiene ESTA deficiencia
                                             CantidadArchivos = ctx.Archivos.Count(a => a.ArchCodTabla == d.DefiInterno && a.ArchActivo == true && a.ArchTipo != "0")
                                         }).ToList();

                // Agrupamos en RAM usando el Código GIS (VanoCodigo) como llave para búsqueda instantánea O(1)
                var defsAgrupadasPorVano = deficienciasVanos
                    .GroupBy(x => x.CodigoNodo)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // =================================================================================
                // 3. MAPEO FINAL Y REGLA DE NEGOCIO (Las 4 Fotos)
                // =================================================================================
                var result = vanosBD.Select(v =>
                {
                    // Estado por defecto (en caso de que el vano no tenga ninguna deficiencia registrada)
                    // *Nota: Si VanoInspeccionado fuera nullable (bool?), cámbialo a: v.VanoInspeccionado ?? false;
                    bool estadoFinalCompletado = v.VanoInspeccionado;

                    // Si el vano tiene deficiencias, aplicamos la regla estricta
                    if (defsAgrupadasPorVano.ContainsKey(v.VanoCodigo))
                    {
                        var defsDelVano = defsAgrupadasPorVano[v.VanoCodigo];

                        // REGLA 1: Todas las deficiencias de este vano deben estar marcadas como Inspeccionadas
                        bool todasInspeccionadas = defsDelVano.All(d => d.Inspeccionado == true);

                        // REGLA 2: TODAS las deficiencias deben tener al menos 4 fotos
                        bool cumplenFotos = defsDelVano.All(d => d.CantidadArchivos >= 4);

                        // El vano solo está completado si cumple ambas reglas en su totalidad
                        estadoFinalCompletado = todasInspeccionadas && cumplenFotos;
                    }

                    return new
                    {
                        Id = v.VanoInterno,
                        Code = v.VanoCodigo,

                        Lat1 = v.VanoLatitudIni,
                        Lon1 = v.VanoLongitudIni,
                        Lat2 = v.VanoLatitudFin,
                        Lon2 = v.VanoLongitudFin,

                        Type = "Gap",

                        // 🔥 AQUÍ SE INYECTA EL CÁLCULO ESTRICTO
                        Inspeccionado = estadoFinalCompletado
                    };
                }).ToList();

                return result;
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
                        existente.VanoTerceros = x_vano.VanoTerceros;

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
        public List<Vano> DAVano_GetByFeederWeb(int x_feeder_id)
        {
            // 1. Usar 'using' para cerrar la conexión inmediatamente al terminar
            using (SigreContext ctx = new SigreContext())
            {
                var vanos = ctx.Vanos
                    .AsNoTracking() // 2. Indispensable para lectura rápida (sin cache de EF)
                    .Where(v => v.AlimInterno == x_feeder_id)
                    .Select(van => new Vano()
                    {
                        // Identificadores
                        VanoInterno = van.VanoInterno,
                        VanoCodigo = van.VanoCodigo,
                        VanoEtiqueta = van.VanoEtiqueta,
                        AlimInterno = van.AlimInterno,

                        // 🔥 CRÍTICO: ELIMINAMOS 'AlimInternoNavigation'
                        // Esta línea obligaba a traer toda la info del alimentador repetida miles de veces.
                        // AlimInternoNavigation = van.AlimInternoNavigation, 

                        // Geometría
                        VanoLatitudIni = van.VanoLatitudIni,
                        VanoLongitudIni = van.VanoLongitudIni,
                        VanoLatitudFin = van.VanoLatitudFin,
                        VanoLongitudFin = van.VanoLongitudFin,

                        // Topología
                        VanoNodoInicial = van.VanoNodoInicial,
                        VanoNodoFinal = van.VanoNodoFinal,

                        // Datos Técnicos
                        // Usamos '??' que es más limpio para nulos
                        VanoMaterial = van.VanoMaterial ?? "ALU",
                        VanoTerceros = van.VanoTerceros,
                        VanoInspeccionado = van.VanoInspeccionado,
                        VanoTramo = van.VanoTramo,

                        // Agrega Subestación si tu modelo lo tiene y lo usas en el Front
                        // VanoSubestacion = van.VanoSubestacion
                    })
                    .ToList();

                return vanos;
            }
        }
        public List<Vano> DAGAP_GetBySedWeb(int idSed)
        {
            using (SigreContext ctx = new SigreContext())
            {
                var vanos = ctx.Vanos
                    
                    .Where(v => v.VanoSubestacion == idSed) // Filtro por SED
                    .Select(v => new Vano()
                    {
                        VanoInterno = v.VanoInterno,
                        VanoCodigo = v.VanoCodigo,
                        VanoEtiqueta = v.VanoEtiqueta,
                        AlimInterno = v.AlimInterno,
                        VanoSubestacion = v.VanoSubestacion,

                        // Geometría
                        VanoLatitudIni = v.VanoLatitudIni,
                        VanoLongitudIni = v.VanoLongitudIni,
                        VanoLatitudFin = v.VanoLatitudFin,
                        VanoLongitudFin = v.VanoLongitudFin,

                        // Topología
                        VanoNodoInicial = v.VanoNodoInicial,
                        VanoNodoFinal = v.VanoNodoFinal,

                        // Detalles
                        VanoMaterial = v.VanoMaterial ?? "ALU",
                        VanoTerceros = v.VanoTerceros,
                        VanoEsBt = v.VanoEsBt
                    })
                    .ToList();

                return vanos;
            }
        }
        // Asegúrate de tener la clase PagedResult<T> definida en tu proyecto (la que creamos antes).

        public PagedResult<Vano> DAGAP_GetPaginado(int skip, int take, string codigo = "", string etiqueta = "", int? alimentadorId = null, int? sedId = null)
        {
            using (SigreContext ctx = new SigreContext())
            {
                ctx.ChangeTracker.LazyLoadingEnabled = false;
                ctx.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;

                // 1. VALIDACIÓN DE TAKE
                if (take <= 0) take = 5000;
                if (take > 5000) take = 5000;

                // 2. CONSULTA BASE CON RESTRICCIÓN OBLIGATORIA (Solo Baja Tensión)
                var query = ctx.Vanos
                    .AsNoTracking()
                    .Where(v => v.VanoEsBt == true) // Aplicamos el filtro BT de inmediato
                    .AsQueryable();

                // 🔥 NUEVO: FILTROS JERÁRQUICOS OPCIONALES
                if (alimentadorId.HasValue && alimentadorId.Value > 0)
                {
                    query = query.Where(v => v.AlimInterno == alimentadorId.Value);
                }

                if (sedId.HasValue && sedId.Value > 0)
                {
                    query = query.Where(v => v.VanoSubestacion == sedId.Value);
                }

                // 3. FILTRO OPCIONAL DE BÚSQUEDA
                bool hasCodigo = !string.IsNullOrWhiteSpace(codigo);
                bool hasEtiqueta = !string.IsNullOrWhiteSpace(etiqueta);

                if (hasCodigo && hasEtiqueta)
                {
                    codigo = codigo.Trim();
                    etiqueta = etiqueta.Trim();
                    // Busca por Código (y nodos) O por Etiqueta
                    query = query.Where(v => v.VanoCodigo.Contains(codigo) ||
                                             v.VanoNodoInicial.Contains(codigo) ||
                                             v.VanoNodoFinal.Contains(codigo) ||
                                             (v.VanoEtiqueta != null && v.VanoEtiqueta.Contains(etiqueta)));
                }
                else if (hasCodigo)
                {
                    codigo = codigo.Trim();
                    query = query.Where(v => v.VanoCodigo.Contains(codigo) ||
                                             v.VanoNodoInicial.Contains(codigo) ||
                                             v.VanoNodoFinal.Contains(codigo));
                }
                else if (hasEtiqueta)
                {
                    etiqueta = etiqueta.Trim();
                    query = query.Where(v => v.VanoEtiqueta != null && v.VanoEtiqueta.Contains(etiqueta));
                }
                // 4. CONTEO (CRÍTICO: Ya cuenta solo los de Baja Tensión filtrados por Alim/SED)
                int totalRecords = query.Count();

                // 5. PAGINACIÓN Y ORDENAMIENTO
                var data = query
                    // Ordenamos de mayor a menor por el ID interno para traer los más recientes
                    .OrderByDescending(v => v.VanoInterno)
                    .Skip(skip)
                    .Take(take)
                    .Select(v => new Vano
                    {
                        // PROYECCIÓN SOLO LO NECESARIO
                        VanoInterno = v.VanoInterno,
                        VanoCodigo = v.VanoCodigo,
                        VanoEtiqueta = v.VanoEtiqueta,
                        VanoNodoInicial = v.VanoNodoInicial,
                        VanoNodoFinal = v.VanoNodoFinal,
                        VanoLatitudIni = v.VanoLatitudIni,
                        VanoLongitudIni = v.VanoLongitudIni,
                        VanoLatitudFin = v.VanoLatitudFin,
                        VanoLongitudFin = v.VanoLongitudFin,
                        VanoMaterial = v.VanoMaterial,
                        AlimInterno = v.AlimInterno,
                        VanoSubestacion = v.VanoSubestacion,
                        VanoEsBt = v.VanoEsBt,
                        VanoTramo=v.VanoTramo,
                        TramInterno=v.TramInterno
                    })
                    .ToList();

                return new PagedResult<Vano> { TotalRecords = totalRecords, Data = data };
            }
        }

        public Dictionary<string, string> DAGAP_ObtenerTramosPorAlimentador(int alimInterno)
        {
            using var ctx = new SigreContext();

            return (
                from v in ctx.Vanos.AsNoTracking()
                join t in ctx.Tramos.AsNoTracking()
                    on v.TramInterno equals t.TramInterno
                where v.AlimInterno == alimInterno
                      && v.VanoEsMt == true
                select new
                {
                    VanoCodigo = v.VanoCodigo,
                    TramoCodigo = t.TramCodigo
                }
            ).ToDictionary(
                x => x.VanoCodigo,
                x => x.TramoCodigo
            );
        }

        public ExcelWorkbook DAGAP_AgregarTramosAlReporte(ExcelWorkbook workbook, int alimInterno)
        {
            DAGap dAGap = new DAGap();

            var tramosPorVano = dAGap.DAGAP_ObtenerTramosPorAlimentador(alimInterno);

            const int filaVanos = 10;
            const int filaTramos = 8;
            const int columnaInicioVanos = 13; // M
            const int columnaEtiquetaTramos = 12; // K

            // Buscar únicamente la hoja VMT
            var ws = workbook.Worksheets["VMT"];

            if (ws == null || ws.Dimension == null)
                return workbook;

            int ultimaColumna = ws.Dimension.End.Column;

            // Guardar los códigos de vano antes de insertar la fila.
            var vanosPorColumna = new Dictionary<int, string>();

            int ultimaColumnaVanos = columnaInicioVanos - 1;

            for (int columna = columnaInicioVanos; columna <= ultimaColumna; columna++)
            {
                string vanoCodigo = ws.Cells[filaVanos, columna]
                    .Text?
                    .Trim();

                if (!string.IsNullOrWhiteSpace(vanoCodigo))
                {
                    vanosPorColumna[columna] = vanoCodigo;
                    ultimaColumnaVanos = columna;
                }
            }

            // Insertar nueva fila en la posición 8.
            ws.InsertRow(filaTramos, 1);

            // Colocar "Tramos MT" antes de las columnas de vanos.
            var celdaEtiqueta = ws.Cells[filaTramos, columnaEtiquetaTramos];

            celdaEtiqueta.Value = "Tramos MT";

            var tramosAgregados = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Colocar el código de tramo correspondiente a cada vano.
            foreach (var item in vanosPorColumna)
            {
                int columna = item.Key;
                string vanoCodigo = item.Value;

                if (tramosPorVano.TryGetValue(vanoCodigo, out string tramoCodigo) &&
                    !string.IsNullOrWhiteSpace(tramoCodigo))
                {
                    var celda = ws.Cells[filaTramos, columna];

                    celda.Value = tramoCodigo;

                    celda.Style.Border.Top.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.Border.Left.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.Border.Right.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                    celda.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Center;

                    // Contabilizar solamente los tramos agregados al Excel.
                    tramosAgregados.Add(tramoCodigo);
                }
            }

            // Cantidad de tramos únicos agregados al Excel.
            var celdaCantidad = ws.Cells[filaTramos, 11];

            celdaCantidad.Value = tramosAgregados.Count;
            celdaCantidad.Style.Border.Top.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.Border.Left.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.Border.Right.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
            celdaCantidad.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Center;

            // Bordes de "Tramos MT".
            celdaEtiqueta.Style.Border.Top.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.Border.Left.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.Border.Right.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
            celdaEtiqueta.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Center;

            return workbook;
        }
    }
}
