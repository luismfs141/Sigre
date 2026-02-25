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

            var archPostes =
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join p in ctx.Postes on df.DefiIdElemento equals p.PostInterno
                join s in ctx.Seds on p.PostSubestacion equals s.SedInterno
                where df.DefiTipoElemento == "POST"
                      && x_seds.Contains(s.SedInterno)
                select ar;

            var archVanos =
                from ar in ctx.Archivos
                join df in ctx.Deficiencias on ar.ArchCodTabla equals df.DefiInterno
                join v in ctx.Vanos on df.DefiIdElemento equals v.VanoInterno
                join s in ctx.Seds on v.VanoSubestacion equals s.SedInterno
                where df.DefiTipoElemento == "VANO"
                      && x_seds.Contains(s.SedInterno)
                select ar;

            return archPostes
                   .Union(archVanos)
                   .Distinct()
                   .ToList();
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
            var resultado = new List<(int, int)>();

            var daDef = new DADeficiency();

            foreach (var dto in archivosOffline)
            {
                // =========================
                // 1) Resolver Deficiencia padre (ID SERVER)
                // =========================
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

                // Si no se pudo resolver la deficiencia, no sincronizamos este archivo
                if (idDeficiency <= 0)
                    continue;

                // Guardamos en el DTO si quieres mantener consistencia (aunque sea int? en el dto)
                dto.ArchCodTabla = idDeficiency;

                // =========================
                // 2) Normalizar ruta para comparar sin raíz (SIGRE.MOVIL / ELIMINADOS)
                // =========================
                var key = NormalizarRutaSinRaiz(dto.ArchNombre);

                // =========================
                // 3) Buscar existente:
                //    - SIEMPRE dentro de la misma deficiencia (idDeficiency)
                //    - Match por nombre exacto O por EndsWith(key)
                // =========================
                var existente = ctx.Archivos
                    .Where(a => a.ArchCodTabla == idDeficiency && a.ArchNombre != null)
                    .Where(a =>
                        a.ArchNombre == dto.ArchNombre
                        || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith(key))
                        || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith("/" + key))
                        || (!string.IsNullOrWhiteSpace(key) && a.ArchNombre.EndsWith("\\" + key))
                    )
                    .OrderByDescending(a => a.ArchInterno) // por si hay duplicados antiguos, toma el último
                    .FirstOrDefault();

                if (existente != null)
                {
                    // =========================
                    // 4) UPDATE (no duplica aunque cambie raíz)
                    // =========================
                    existente.ArchCodTabla = idDeficiency;      // ✅ int -> int (evita CS0266)
                    existente.ArchNombre = dto.ArchNombre;    // ✅ guarda la ruta NUEVA (SIGRE.MOVIL / ELIMINADOS / etc.)
                    existente.ArchLongitud = dto.ArchLongitud;
                    existente.ArchLatitud = dto.ArchLatitud;
                    existente.ArchActivo = dto.ArchActivo;    // ✅ aquí cae tu ArchActivo=0
                    existente.ArchFecha = dto.ArchFecha;

                    ctx.SaveChanges();

                    resultado.Add((dto.ArchInterno, existente.ArchInterno));
                }
                else
                {
                    // =========================
                    // 5) INSERT
                    // =========================
                    // Asegura que el convert use el idDeficiency ya resuelto
                    dto.ArchCodTabla = idDeficiency;

                    var archivo = DAARCH_ConvertFile(dto);
                    ctx.Archivos.Add(archivo);

                    ctx.SaveChanges(); // para obtener ID

                    resultado.Add((dto.ArchInterno, archivo.ArchInterno));
                }
            }

            return resultado;
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
                    if (filasAfectadas > 0 && defiInternoAsociado > 0)
                    {
                        // Llamamos al método que creamos arriba
                        SincronizarEstadoInspeccionElemento(defiInternoAsociado);
                    }

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
            // Capturamos a qué deficiencia pertenece este archivo
            // Lo hacemos fuera del using por si necesitamos pasarlo al método evaluador
            int idDeficienciaAsociada = 0;

            using (SigreContext ctx = new SigreContext())
            {
                // 1. Lógica para INSERTAR (Nuevo)
                if (x_archivo.ArchInterno == 0)
                {
                    // === GENERACIÓN DE GUID ===
                    if (string.IsNullOrEmpty(x_archivo.DefiUUID))
                    {
                        x_archivo.DefiUUID = Guid.NewGuid().ToString().ToUpper();
                    }

                    // Datos por defecto obligatorios
                    x_archivo.ArchActivo = true;
                    if (x_archivo.ArchFecha == DateTime.MinValue) x_archivo.ArchFecha = DateTime.Now;

                    ctx.Archivos.Add(x_archivo);
                    idDeficienciaAsociada = x_archivo.ArchCodTabla; // Capturamos el ID del padre
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

                        if (x_archivo.ArchFecha > DateTime.MinValue)
                            original.ArchFecha = x_archivo.ArchFecha;

                        if (string.IsNullOrEmpty(original.DefiUUID))
                            original.DefiUUID = Guid.NewGuid().ToString().ToUpper();

                        idDeficienciaAsociada = original.ArchCodTabla; // Capturamos el ID del padre
                    }
                }

                // Guardamos cambios (Esto hará el INSERT o UPDATE automáticamente)
                ctx.SaveChanges();
            }

            // 🔥 PASO REACTIVO: REEVALUAR AL PADRE 🔥
            // Lo llamamos FUERA del 'using' anterior para que abra su propio contexto limpio,
            // o puedes meter la lógica dentro de la misma transacción si prefieres, 
            // pero así es más modular y seguro.
            if (idDeficienciaAsociada > 0)
            {
                ReevaluarEstadoInspeccionDeficiencia(idDeficienciaAsociada);
            }
            if (idDeficienciaAsociada > 0)
            {
                SincronizarEstadoInspeccionElemento(idDeficienciaAsociada);
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
                        deficiencia.DefiUsuarioMod = "SISTEMA_AUTO";
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
    }
}
