using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.SyncData;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace Sigre.DataAccess
{
    public class DAFile
    {
        public void DAARCH_Save(Archivo x_archivo)
        {
            SigreContext ctx = new SigreContext();

            if (x_archivo.ArchInterno == 0)
            {
                ctx.Archivos.Add(x_archivo);
            }
            else
            {
                var original = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == x_archivo.ArchInterno);
                ctx.Entry(original).CurrentValues.SetValues(x_archivo);
            }
            ctx.SaveChanges();
        }

        public List<Archivo> DAARCH_GetByDeficiency(int x_deficiency)
        {
            SigreContext ctx = new SigreContext();

            var files =
                (from a in ctx.Archivos
                 where a.ArchCodTabla == x_deficiency
                 select a).ToList();

            return files;
        }
        public List<Archivo> DAARCH_GetByFeeder(int x_feeder_id)
        {
            SigreContext ctx = new SigreContext();

            var query = (
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join amt in ctx.Alimentadores on df.DefiCodAmt equals amt.AlimCodigo
                where amt.AlimInterno == x_feeder_id
                select ar
                );

            return query.ToList();
        }

        public List<Archivo> DAARCH_GetByFeeders(List<int> x_feeders)
        {
            using var ctx = new SigreContext();

            var query = from ar in ctx.Archivos
                        join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                        join amt in ctx.Alimentadores on df.DefiCodAmt equals amt.AlimCodigo
                        where x_feeders.Contains(amt.AlimInterno)
                        select ar;

            return query.ToList();
        }

        public List<Archivo> DAARCH_GetBySeds(List<int> x_seds)
        {
            using var ctx = new SigreContext();

            // Apagamos el tracking para ahorrar muchísima memoria RAM
            ctx.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;

            var archPostes =
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join p in ctx.Postes on df.DefiIdElemento equals p.PostInterno
                where df.DefiTipoElemento == "POST" && x_seds.Contains((int)p.PostSubestacion)
                select ar;

            var archVanos =
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join v in ctx.Vanos on df.DefiIdElemento equals v.VanoInterno
                where df.DefiTipoElemento == "VANO" && x_seds.Contains((int)v.VanoSubestacion)
                select ar;

            // Usamos Concat (UNION ALL) que es infinitamente más ligero
            return archPostes.Concat(archVanos).ToList();
        }


        public Archivo DAARCH_GetTableData()
        {
            SigreContext ctx = new SigreContext();

            Archivo archivoTabla = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == 1);
            return archivoTabla;
        }

        public List<(int localId, int serverId)> DAARCH_SyncFromSQLite(List<ArchivoSyncDto> archivosOffline)
        {
            using var ctx = new SigreContext();

            if (archivosOffline == null || archivosOffline.Count == 0)
                return new List<(int localId, int serverId)>();

            using var tx = ctx.Database.BeginTransaction();

            try
            {
                var daDef = new DADeficiency();
                var mappings = new List<(int localId, Archivo entity)>();

                foreach (var dto in archivosOffline)
                {
                    if (string.IsNullOrWhiteSpace(dto.ArchNombre))
                        throw new Exception($"El archivo local {dto.ArchInterno} no tiene ArchNombre.");

                    int idDeficiency;

                    if (!string.IsNullOrWhiteSpace(dto.DefiUUID))
                    {
                        idDeficiency = daDef.DADEFI_GetDeficiencyIDByUUID(dto.DefiUUID);
                    }
                    else
                    {
                        idDeficiency = daDef.DADEFI_GetDeficiencyIDByElementAndType(
                            dto.ArchIdElemento ?? 0,
                            dto.ArchTipoElemento ?? string.Empty,
                            dto.TipiInterno ?? 0
                        );
                    }

                    if (idDeficiency <= 0)
                        throw new Exception($"No se pudo resolver la deficiencia padre del archivo local {dto.ArchInterno}.");

                    dto.ArchCodTabla = idDeficiency;

                    var key = NormalizarRutaSinRaiz(dto.ArchNombre);

                    var existente = ctx.Archivos
                        .Where(a => a.ArchCodTabla == idDeficiency && a.ArchNombre != null)
                        .Where(a =>
                            a.ArchNombre == dto.ArchNombre
                            || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith(key))
                            || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith("/" + key))
                            || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith("\\" + key))
                        )
                        .OrderByDescending(a => a.ArchInterno)
                        .FirstOrDefault();

                    if (existente != null)
                    {
                        existente.ArchCodTabla = idDeficiency;
                        existente.ArchNombre = dto.ArchNombre;
                        existente.ArchLongitud = dto.ArchLongitud;
                        existente.ArchLatitud = dto.ArchLatitud;
                        existente.ArchActivo = dto.ArchActivo;
                        existente.ArchFecha = dto.ArchFecha;
                        existente.ArchTipo = dto.ArchTipo;
                        existente.ArchTabla = dto.ArchTabla;
                        existente.ArchTipoElemento = dto.ArchTipoElemento;
                        existente.ArchIdElemento = dto.ArchIdElemento;
                        existente.TipiInterno = dto.TipiInterno;

                        if (!string.IsNullOrWhiteSpace(dto.DefiUUID))
                        {
                            var uuid = dto.DefiUUID.Trim();
                            existente.DefiUUID = uuid.Length > 50 ? uuid.Substring(0, 50) : uuid;
                        }

                        mappings.Add((dto.ArchInterno, existente));
                    }
                    else
                    {
                        var archivo = DAARCH_ConvertFile(dto);
                        ctx.Archivos.Add(archivo);
                        mappings.Add((dto.ArchInterno, archivo));
                    }
                }

                ctx.SaveChanges();
                tx.Commit();

                return mappings
                    .Select(x => (x.localId, x.entity.ArchInterno))
                    .ToList();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        /// <summary>
        /// Quita prefijos variables (SIGRE.MOVIL/, ELIMINADOS/) y deja solo el "subpath" estable.
        /// Ej:
        ///   "SIGRE.MOVIL/sub/elem/foto.jpg" => "sub/elem/foto.jpg"
        ///   "ELIMINADOS/sub/elem/foto.jpg"  => "sub/elem/foto.jpg"
        /// </summary>
        private static string NormalizarRutaSinRaiz(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return string.Empty;

            path = path.Replace("\\", "/").Trim();

            while (path.StartsWith("/"))
                path = path.Substring(1);

            const string p1 = "SIGRE.MOVIL/";
            const string p2 = "ELIMINADOS/";

            if (path.StartsWith(p1, StringComparison.OrdinalIgnoreCase))
                return path.Substring(p1.Length);

            if (path.StartsWith(p2, StringComparison.OrdinalIgnoreCase))
                return path.Substring(p2.Length);

            // fallback: quita primer segmento "RAIZ/"
            int idx = path.IndexOf('/');
            if (idx >= 0 && idx < path.Length - 1)
                return path.Substring(idx + 1);

            return path;
        }



        // MÉTODO 1: ELIMINADO LÓGICO (Soft Delete)
        public bool DAFILE_SoftDelete(int idArchivo)
        {
            using (SigreContext ctx = new SigreContext())
            {
                try
                {
                    // 🔥 PASO 1: Descubrir a qué deficiencia pertenece esta foto ANTES de borrarla
                    // (Usamos Nullable int por si no se encuentra o es 0)
                    int defiInternoAsociado = ctx.Archivos
                        .Where(a => a.ArchInterno == idArchivo)
                        .Select(a => a.ArchCodTabla)
                        .FirstOrDefault();

                    // === SQL DIRECTO (Bypass Entity Framework) ===
                    string sql = "UPDATE Archivos SET ARCH_Activo = 0 WHERE ARCH_Interno = {0}";
                    int filasAfectadas = ctx.Database.ExecuteSqlRaw(sql, idArchivo);

                    // 🔥 PASO 2: REACCIÓN EN TIEMPO REAL
                    // Si se borró correctamente y pertenecía a una deficiencia, disparamos la reevaluación
                    if (filasAfectadas > 0 && defiInternoAsociado > 0)
                    {
                        // Llamamos al método que creamos arriba
                        ReevaluarEstadoInspeccionDeficiencia(defiInternoAsociado);
                    }
                    //if (filasAfectadas > 0 && defiInternoAsociado > 0)
                    //{
                    //    // Llamamos al método que creamos arriba
                    //    SincronizarEstadoInspeccionElemento(defiInternoAsociado);
                    //}

                    return filasAfectadas > 0;
                }
                catch (Exception)
                {
                    return false;
                }
            }
        }
        public void DAARCH_SaveInWeb(Archivo x_archivo)
        {
            int idDeficienciaAsociada = 0;

            using (SigreContext ctx = new SigreContext())
            {
                // 🔥 LA REGLA DE ORO: El UUID del archivo DEBE ser el mismo que el del padre.
                // Buscamos al padre (Deficiencia) para copiarle su UUID (DefiCol3)
                var deficienciaPadre = ctx.Deficiencias
                                          .AsNoTracking()
                                          .FirstOrDefault(d => d.DefiInterno == x_archivo.ArchCodTabla);

                string uuidHeredado = deficienciaPadre?.DefiCol3 ?? "";

                // 1. Lógica para INSERTAR (Nuevo)
                if (x_archivo.ArchInterno == 0)
                {
                    // Heredamos el UUID del padre en lugar de inventar uno nuevo
                    x_archivo.DefiUUID = uuidHeredado;

                    x_archivo.ArchActivo = true;
                    if (x_archivo.ArchFecha == DateTime.MinValue || x_archivo.ArchFecha == null)
                    {
                        x_archivo.ArchFecha = DateTime.Now;
                    }

                    ctx.Archivos.Add(x_archivo);
                    idDeficienciaAsociada = x_archivo.ArchCodTabla;
                }
                // 2. Lógica para ACTUALIZAR (Existente)
                else
                {
                    var original = ctx.Archivos.SingleOrDefault(a => a.ArchInterno == x_archivo.ArchInterno);
                    if (original != null)
                    {
                        original.ArchNombre = x_archivo.ArchNombre;
                        original.ArchTipo = x_archivo.ArchTipo;
                        original.ArchActivo = x_archivo.ArchActivo;
                        original.ArchLatitud = x_archivo.ArchLatitud;
                        original.ArchLongitud = x_archivo.ArchLongitud;
                        original.TipiInterno = x_archivo.TipiInterno;

                        if (x_archivo.ArchFecha > DateTime.MinValue)
                            original.ArchFecha = x_archivo.ArchFecha;

                        // Si por alguna razón histórica no tiene UUID, lo reparamos heredándolo del padre
                        if (string.IsNullOrEmpty(original.DefiUUID) && !string.IsNullOrEmpty(uuidHeredado))
                        {
                            original.DefiUUID = uuidHeredado;
                        }

                        idDeficienciaAsociada = original.ArchCodTabla;
                    }
                }

                ctx.SaveChanges();
            }

            // PASO REACTIVO: REEVALUAR AL PADRE
            if (idDeficienciaAsociada > 0)
            {
                ReevaluarEstadoInspeccionDeficiencia(idDeficienciaAsociada);
            }
        }
        public int ARCH_ExistPhoto(string ruta)
        {
            SigreContext ctx = new SigreContext();

            Archivo archivo = ctx.Archivos.SingleOrDefault(a => a.ArchNombre == ruta);

            if ((archivo is not null))
            {
                return archivo.ArchInterno;
            }
            else
            {
                return 0;
            }
        }
        public Archivo ARCH_ConvertFile(ArchivoSyncDto arch_offline)
        {
            return new Archivo
            {
                // 🔑 Identificadores
                ArchInterno = arch_offline.ArchInterno,

                // 📁 Información del archivo
                ArchTipo = arch_offline.ArchTipo,
                ArchTabla = arch_offline.ArchTabla,
                ArchCodTabla = (int)arch_offline.ArchCodTabla,
                ArchNombre = arch_offline.ArchNombre,

                // 📍 Ubicación
                ArchLatitud = arch_offline.ArchLatitud,
                ArchLongitud = arch_offline.ArchLongitud,

                // 📅 Fecha
                ArchFecha = arch_offline.ArchFecha,

                // 🔗 Relación con elemento
                ArchTipoElemento = arch_offline.ArchTipoElemento,
                ArchIdElemento = arch_offline.ArchIdElemento,
                TipiInterno = arch_offline.TipiInterno,

                // ⚙️ Estado
                ArchActivo = arch_offline.ArchActivo,
            };
        }
        public void DADEFI_UpdateCodTablaByDeficiency(
            SigreContext ctx,
            Deficiencia deficiencia
        )
        {
            if (deficiencia == null)
                return;

            var archivos = ctx.Archivos
                .Where(a =>
                    a.ArchTabla == "Deficiencias" &&
                    a.ArchIdElemento == deficiencia.DefiIdElemento &&
                    a.ArchTipoElemento == deficiencia.DefiTipoElemento &&
                    a.TipiInterno == deficiencia.TipiInterno &&
                    a.ArchCodTabla != deficiencia.DefiInterno
                )
                .ToList();

            foreach (var archivo in archivos)
            {
                archivo.ArchCodTabla = deficiencia.DefiInterno;
            }
        }
        public void DADEFI_UpdateCodTablaBySed(string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo))
                return;

            var dASed = new DASed();
            var sed = dASed.DASed_GetByCodigo(codigo);
            if (sed == null)
                return;

            using var ctx = new SigreContext();

            var idPostes = ctx.Postes
                .Where(p => p.PostSubestacion == sed.SedInterno)
                .Select(p => p.PostInterno)
                .ToList();

            var idVanos = ctx.Vanos
                .Where(v => v.VanoSubestacion == sed.SedInterno)
                .Select(v => v.VanoInterno)
                .ToList();

            var deficiencias = ctx.Deficiencias
                .Where(d =>
                    (d.DefiTipoElemento == "POST" &&
                     d.DefiIdElemento != null &&
                     idPostes.Contains((int)d.DefiIdElemento)) ||
                    (d.DefiTipoElemento == "VANO" &&
                     d.DefiIdElemento != null &&
                     idVanos.Contains((int)d.DefiIdElemento))
                )
                .ToList();

            if (!deficiencias.Any())
                return;

            using var tx = ctx.Database.BeginTransaction();

            try
            {
                foreach (var def in deficiencias)
                {
                    DADEFI_UpdateCodTablaByDeficiency(ctx, def);
                }

                ctx.SaveChanges();
                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public Archivo DAARCH_ConvertFile(ArchivoSyncDto arch_offline)
        {
            string defiUuid = null;
            if (!string.IsNullOrWhiteSpace(arch_offline.DefiUUID))
            {
                defiUuid = arch_offline.DefiUUID.Trim();
                if (defiUuid.Length > 50) defiUuid = defiUuid.Substring(0, 50);
            }

            return new Archivo
            {
                ArchTipo = arch_offline.ArchTipo,
                ArchTabla = arch_offline.ArchTabla,
                ArchCodTabla = (int)arch_offline.ArchCodTabla,
                ArchNombre = arch_offline.ArchNombre,

                ArchLatitud = arch_offline.ArchLatitud,
                ArchLongitud = arch_offline.ArchLongitud,

                ArchFecha = arch_offline.ArchFecha,

                ArchTipoElemento = arch_offline.ArchTipoElemento,
                ArchIdElemento = arch_offline.ArchIdElemento,
                TipiInterno = arch_offline.TipiInterno,

                ArchActivo = arch_offline.ArchActivo,

                // ✅ INSERT también guarda DEFI_UUID
                DefiUUID = defiUuid
            };
        }
        public List<Archivo> DAARCH_GetByDeficiencyWeb(int x_deficiency)
        {
            using (var ctx = new SigreContext())
            {
                // TRUCO: Proyección manual para evitar errores de EF y traer solo lo necesario
                var query = ctx.Archivos
                    .Where(a => a.ArchCodTabla == x_deficiency && a.ArchActivo == true) // Agregué && a.ArchActivo == true por seguridad
                    .Select(a => new Archivo
                    {
                        // === CAMPOS BÁSICOS ===
                        ArchInterno = a.ArchInterno,
                        ArchNombre = a.ArchNombre,
                        ArchTipo = a.ArchTipo,
                        ArchFecha = a.ArchFecha,

                        // === RELACIONES ===
                        ArchIdElemento = a.ArchIdElemento,
                        ArchTipoElemento = a.ArchTipoElemento, // Importante recuperarlo si lo guardaste
                        TipiInterno = a.TipiInterno,           // Importante recuperarlo si lo guardaste

                        // === GEORREFERENCIA ===
                        ArchLatitud = a.ArchLatitud,
                        ArchLongitud = a.ArchLongitud,

                        // === METADATOS ===
                        ArchCodTabla = a.ArchCodTabla,
                        ArchTabla = a.ArchTabla,
                        ArchActivo = a.ArchActivo,

                        // === 👇 LA NUEVA COLUMNA (CRUCIAL) 👇 ===
                        // Asegúrate de que coincida con el nombre en tu clase Archivo.cs (DefiUUID)
                        DefiUUID = a.DefiUUID
                    });

                return query.ToList();
            }
        }
        public DataTable DAARCH_GetArchivosBySedsDT(List<int> sedInternos)
        {
            using var ctx = new SigreContext();

            var list =
            (
                from a in ctx.Archivos.AsNoTracking()

                join p in ctx.Postes on a.ArchIdElemento equals p.PostInterno into pj
                from p in pj.DefaultIfEmpty()

                join v in ctx.Vanos on a.ArchIdElemento equals v.VanoInterno into vj
                from v in vj.DefaultIfEmpty()

                where
                    (a.ArchTipoElemento == "POST" && sedInternos.Contains((int)p.PostSubestacion)) ||
                    (a.ArchTipoElemento == "VANO" && sedInternos.Contains((int)v.VanoSubestacion))

                select a
            ).ToList();   // 🔥 UNA SOLA CONSULTA

            // 🔹 DataTable completo
            var dt = new DataTable();

            dt.Columns.Add("ARCH_Interno", typeof(int));
            dt.Columns.Add("ARCH_Tipo", typeof(int));
            dt.Columns.Add("ARCH_Tabla", typeof(string));
            dt.Columns.Add("ARCH_CodTabla", typeof(int));
            dt.Columns.Add("ARCH_Nombre", typeof(string));
            dt.Columns.Add("ARCH_Latitud", typeof(double));
            dt.Columns.Add("ARCH_Longitud", typeof(double));
            dt.Columns.Add("ARCH_Fecha", typeof(DateTime));
            dt.Columns.Add("ARCH_TipoElemento", typeof(string));
            dt.Columns.Add("ARCH_IdElemento", typeof(int));
            dt.Columns.Add("TIPI_Interno", typeof(int));
            dt.Columns.Add("ARCH_Activo", typeof(bool));
            dt.Columns.Add("DEFI_UUID", typeof(string));

            foreach (var a in list)
            {
                dt.Rows.Add(
                    a.ArchInterno,
                    a.ArchTipo,
                    a.ArchTabla,
                    a.ArchCodTabla,
                    a.ArchNombre,
                    a.ArchLatitud,
                    a.ArchLongitud,
                    a.ArchFecha,
                    a.ArchTipoElemento,
                    a.ArchIdElemento,
                    a.TipiInterno,
                    a.ArchActivo,
                    a.DefiUUID
                );
            }

            return dt;
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


        // Usamos el disco H:\ como raíz, 
        public string _baseDirectory = @"H:\";

        public async Task<bool> MoverArchivoFisicoAsync(string oldPath, string newPath)
        {
            try
            {
                // 1. Normalizamos las barras para Windows (\) y combinamos con la raíz D:\
                string absoluteOldPath = Path.Combine(_baseDirectory, oldPath.Replace("/", "\\"));
                string absoluteNewPath = Path.Combine(_baseDirectory, newPath.Replace("/", "\\"));

                // 2. Verificamos si el archivo original realmente existe en el disco
                if (!File.Exists(absoluteOldPath))
                {
                    throw new FileNotFoundException($"El archivo no existe en el disco: {absoluteOldPath}");
                }

                // 3. Obtenemos la carpeta destino (ej. D:\SIGRE.MOVIL\CHACHANI\1887\POSTE\PTO000055171\SINDEF)
                string targetDirectory = Path.GetDirectoryName(absoluteNewPath);

                // 4. Si la carpeta destino no existe, la creamos (crea toda la jerarquía de golpe)
                if (!Directory.Exists(targetDirectory))
                {
                    Directory.CreateDirectory(targetDirectory);
                }

                // 5. Movemos el archivo (esto equivale a cortar, pegar y renombrar)
                // Nota: El parámetro 'true' permite sobrescribir si ya existe un archivo con ese nombre (.NET Core 3.0+)
                File.Move(absoluteOldPath, absoluteNewPath, overwrite: true);

                // 🔥 NUEVO: Limpieza automática de la carpeta antigua
                try
                {
                    // 1. Obtenemos la ruta de la carpeta de la deficiencia (ej. ...\6002)
                    string oldDirectory = Path.GetDirectoryName(absoluteOldPath);

                    // Si la carpeta de deficiencia existe y está vacía, la borramos
                    if (Directory.Exists(oldDirectory) && !Directory.EnumerateFileSystemEntries(oldDirectory).Any())
                    {
                        Directory.Delete(oldDirectory); // Borra el 6002

                        // 2. Ahora miramos la carpeta padre, que es el Elemento (ej. ...\VBT000184260)
                        string elementDirectory = Path.GetDirectoryName(oldDirectory);

                        // Si la carpeta del elemento existe y también quedó vacía, la borramos
                        if (Directory.Exists(elementDirectory) && !Directory.EnumerateFileSystemEntries(elementDirectory).Any())
                        {
                            Directory.Delete(elementDirectory); // Borra el VBT000184260
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Si falla el borrado de la carpeta (ej. bloqueada por el sistema), 
                    // lo ignoramos para no interrumpir el flujo, ya que la foto sí se movió.
                    Console.WriteLine($"No se pudo eliminar la carpeta antigua: {ex.Message}");
                }
                // File.Move es muy rápido, retornamos Task.CompletedTask para mantener la firma async
                await Task.CompletedTask;
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error en DA al mover archivo: {ex.Message}", ex);
            }
        
    }
        public async Task<bool> CopiarArchivoFisicoAsync(string oldPath, string newPath)
        {
            try
            {
                string absoluteOldPath = Path.Combine(_baseDirectory, oldPath.Replace("/", "\\"));
                string absoluteNewPath = Path.Combine(_baseDirectory, newPath.Replace("/", "\\"));

                // 🔥 CONTROL ESTRICTO SOLO PARA .m4a
                if (!File.Exists(absoluteOldPath))
                {
                    // Si el archivo que falta es un audio .m4a, lo perdonamos y devolvemos false
                    if (absoluteOldPath.EndsWith(".m4a", StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    // Si falta una foto (.jpg) u otro archivo, ¡explotamos y avisamos del error!
                    throw new FileNotFoundException($"Falta evidencia crítica en el disco: {absoluteOldPath}");
                }

                string targetDirectory = Path.GetDirectoryName(absoluteNewPath);
                if (!Directory.Exists(targetDirectory))
                {
                    Directory.CreateDirectory(targetDirectory);
                }

                if (absoluteOldPath.Equals(absoluteNewPath, StringComparison.OrdinalIgnoreCase)) return true;

                int maxRetries = 5;
                for (int i = 0; i < maxRetries; i++)
                {
                    try
                    {
                        using (var sourceStream = new FileStream(absoluteOldPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
                        using (var destStream = new FileStream(absoluteNewPath, FileMode.Create, FileAccess.Write, FileShare.None))
                        {
                            await sourceStream.CopyToAsync(destStream);
                        }
                        return true;
                    }
                    catch (IOException)
                    {
                        if (i == maxRetries - 1) throw;
                        await Task.Delay(1000);
                    }
                }
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error de disco al copiar: {ex.Message}", ex);
            }
        }
        public async Task<bool> OverwritePhysicalImageAsync(int archInterno, IFormFile file)
        {
            try
            {
                using (var ctx = new SigreContext())
                {
                    // 1. Buscamos el registro
                    var archivoDB = await ctx.Archivos.FindAsync(archInterno);
                    if (archivoDB == null)
                        throw new Exception($"El archivo con ID {archInterno} no existe en la base de datos.");

                    // 2. Construimos las rutas
                    string absolutePath = Path.Combine(_baseDirectory, archivoDB.ArchNombre.Replace("/", "\\"));
                    string directory = Path.GetDirectoryName(absolutePath);

                    // 3. Verificamos carpeta
                    if (!Directory.Exists(directory))
                        Directory.CreateDirectory(directory);

                    // 4. Pisamos el archivo viejo
                    using (var stream = new FileStream(absolutePath, FileMode.Create, FileAccess.Write, FileShare.None))
                    {
                        await file.CopyToAsync(stream);
                    }

                    return true;
                }
            }
            catch (Exception ex)
            {
                // Escarbamos para sacar el error real (útil para SQL o permisos de disco)
                Exception realError = ex;
                while (realError.InnerException != null)
                {
                    realError = realError.InnerException;
                }

                // Lanzamos el error hacia arriba (al controlador)
                throw new Exception($"DAFile Error: {realError.Message}");
            }
        }
        public string ObtenerRutaFisicaReal(string rutaRelativaBD)
        {
            // 1. Armamos la ruta absoluta para que C# pueda buscar en el disco real (D:\...)
            string rutaAbsoluta = Path.Combine(_baseDirectory, rutaRelativaBD.Replace("/", "\\"));

            // 2. Si existe tal cual, devolvemos la relativa intacta
            if (File.Exists(rutaAbsoluta))
            {
                return rutaRelativaBD;
            }

            // 3. Rescate de carpeta 7004
            string directorioAbsoluto = Path.GetDirectoryName(rutaAbsoluta);
            string nombreArchivoOriginal = Path.GetFileName(rutaAbsoluta);
            string nombreCarpetaFalla = new DirectoryInfo(directorioAbsoluto).Name; // Ej: "7004.1.148773"

            if (nombreCarpetaFalla.StartsWith("7004."))
            {
                string[] partes = nombreCarpetaFalla.Split('.');
                if (partes.Length >= 2)
                {
                    string correlativo = partes[1];
                    string directorioPadreAbsoluto = Path.GetDirectoryName(directorioAbsoluto);

                    // 🔥 INTENTO A: Carpeta limpia + Nombre de archivo SUCIO (Como se ve en tu captura)
                    // Busca en: D:\...\7004\1\FOT-...-7004.1.148773-...jpg
                    string rutaRescateAbsolutaA = Path.Combine(directorioPadreAbsoluto, "7004", correlativo, nombreArchivoOriginal);

                    if (File.Exists(rutaRescateAbsolutaA))
                    {
                        // Devolvemos la ruta relativa reconstruida para que la clonación funcione
                        string dirRelativoPadre = Path.GetDirectoryName(Path.GetDirectoryName(rutaRelativaBD));
                        return Path.Combine(dirRelativoPadre, "7004", correlativo, nombreArchivoOriginal).Replace("\\", "/");
                    }

                    // 🔥 INTENTO B: Carpeta limpia + Nombre de archivo LIMPIO (Por si alguna vez se renombraron)
                    // Busca en: D:\...\7004\1\FOT-...-7004_1-...jpg
                    string nombreLimpio = nombreArchivoOriginal.Replace(nombreCarpetaFalla, $"7004_{correlativo}");
                    string rutaRescateAbsolutaB = Path.Combine(directorioPadreAbsoluto, "7004", correlativo, nombreLimpio);

                    if (File.Exists(rutaRescateAbsolutaB))
                    {
                        string dirRelativoPadre = Path.GetDirectoryName(Path.GetDirectoryName(rutaRelativaBD));
                        return Path.Combine(dirRelativoPadre, "7004", correlativo, nombreLimpio).Replace("\\", "/");
                    }
                }
            }

            // Si nada de la magia funcionó, devuelve la original (probablemente la foto se borró de la computadora)
            return rutaRelativaBD;
        }
    }
}
