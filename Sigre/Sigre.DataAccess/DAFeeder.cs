using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Structs;
using SQLitePCL;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAFeeder
    {
        public List<Alimentadore> DAFeeder_Get()
        {
            SigreContext ctx = new SigreContext();
            List<Alimentadore> feeders = ctx.Alimentadores.OrderBy(a => a.AlimCodigo).ToList();

            return feeders;
        }

        public List<Alimentadore> DAFE_GetFeedersByUser(int id_user)
        {
            SigreContext ctx = new SigreContext();
            List<Alimentadore> feeders = new List<Alimentadore>();

            // Obtener los IDs de los alimentadores asignados al usuario
            var idFeeders = ctx.UsuariosAlimentadores
                               .Where(u => u.UsalUsuario == id_user)
                               .Select(a => a.UsalAlimentador)
                               .ToList();

            // Obtener los alimentadores filtrando por los IDs anteriores
            feeders = ctx.Alimentadores
                             .Where(a => idFeeders.Contains(a.AlimInterno))
                             .ToList();

            return feeders;
        }

        public void DAFE_SaveFeedersByUser(int idUser, int idAlim, bool act)
        {
            SigreContext ctx = new SigreContext();

            var usuarioAlimentador = ctx.UsuariosAlimentadores
                                  .SingleOrDefault(ua => ua.UsalUsuario == idUser && ua.UsalAlimentador == idAlim);

            if (usuarioAlimentador == null && act)
            {
                ctx.UsuariosAlimentadores.Add(new UsuariosAlimentadore
                {
                    UsalUsuario = idUser,
                    UsalAlimentador = idAlim,
                    UsalActivo = true
                });
            }
            else if (usuarioAlimentador != null)
            {
                if (act)
                {
                    usuarioAlimentador.UsalActivo = true;
                    ctx.UsuariosAlimentadores.Update(usuarioAlimentador);
                }
                else
                {
                    ctx.UsuariosAlimentadores.Remove(usuarioAlimentador);
                }
            }

            ctx.SaveChanges();
        }

        public void DAFE_DrawMapByFeeder(int idFeeder)
        {
            using (SigreContext ctx = new SigreContext())
            {
                using (IDbContextTransaction transaction = ctx.Database.BeginTransaction())
                {
                    try
                    {
                        ctx.Database.ExecuteSqlRaw("dbo.sp_DrawMapByFeeder @Feeder",
                        new SqlParameter("@Feeder", idFeeder));
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        throw ex;
                    }
                }
            }
        }

        public void DAFE_CreateDatabaseSqlite(List<int> x_feeders, int x_usuario)
        {
            string logPath = Path.Combine(Environment.CurrentDirectory, $"sigre_offline_log_{DateTime.Now:yyyyMMdd_HHmmss}.txt");

            void Log(string message)
            {
                var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}";
                Console.WriteLine(line);
                try { File.AppendAllText(logPath, line + Environment.NewLine); } catch { /* no bloquear si falla el log file */ }
            }

            // Helper: detecta la propiedad "clave" (KeyAttribute o propiedades comunes)
            PropertyInfo FindKeyProperty(Type t)
            {
                // 1) Buscar [Key]
                var prop = t.GetProperties().FirstOrDefault(p => p.GetCustomAttribute<KeyAttribute>() != null);
                if (prop != null) return prop;

                // 2) Buscar propiedad llamada "Id" (case-insensitive)
                prop = t.GetProperties().FirstOrDefault(p => string.Equals(p.Name, "Id", StringComparison.OrdinalIgnoreCase));
                if (prop != null) return prop;

                // 3) Buscar "<TypeName>Id"
                var candidate = t.Name + "Id";
                prop = t.GetProperties().FirstOrDefault(p => string.Equals(p.Name, candidate, StringComparison.OrdinalIgnoreCase));
                if (prop != null) return prop;

                // 4) Buscar cualquier propiedad que termine en "Id"
                prop = t.GetProperties().FirstOrDefault(p => p.Name.EndsWith("Id", StringComparison.OrdinalIgnoreCase));
                return prop;
            }

            // Helper: valida una colección y devuelve mensajes de problemas (si los hay)
            List<string> ValidateEntitiesKeys<T>(IEnumerable<T> collection, string collectionName)
            {
                var problems = new List<string>();
                if (collection == null)
                {
                    problems.Add($"{collectionName} == null");
                    return problems;
                }

                var list = collection as IList<T> ?? collection.ToList();
                if (!list.Any()) return problems;

                Type t = typeof(T);
                var keyProp = FindKeyProperty(t);
                if (keyProp == null)
                {
                    problems.Add($"{collectionName}: No se encontró propiedad Key en tipo {t.FullName}");
                    return problems;
                }

                for (int i = 0; i < list.Count; i++)
                {
                    try
                    {
                        var item = list[i];
                        var value = keyProp.GetValue(item);

                        // Determinar "nulo" o "sin valor" según tipo
                        if (value == null)
                        {
                            problems.Add($"{collectionName}[{i}] ({t.Name}): {keyProp.Name} == null");
                            continue;
                        }

                        var propType = keyProp.PropertyType;
                        if (propType == typeof(int) || propType == typeof(long) || propType == typeof(short))
                        {
                            long numeric = Convert.ToInt64(value);
                            if (numeric == 0)
                                problems.Add($"{collectionName}[{i}] ({t.Name}): {keyProp.Name} == 0 (posible id no asignado)");
                        }
                        else if (propType == typeof(string))
                        {
                            if (string.IsNullOrWhiteSpace(value as string))
                                problems.Add($"{collectionName}[{i}] ({t.Name}): {keyProp.Name} == empty/null string");
                        }
                        // Otros tipos: si es valor por defecto, también avisamos
                        else if (propType.IsValueType)
                        {
                            var defaultVal = Activator.CreateInstance(propType);
                            if (value.Equals(defaultVal))
                                problems.Add($"{collectionName}[{i}] ({t.Name}): {keyProp.Name} tiene valor por defecto ({defaultVal})");
                        }
                    }
                    catch (Exception ex)
                    {
                        problems.Add($"{collectionName}[{i}] ERROR inspeccionando clave: {ex.Message}");
                    }
                }

                return problems;
            }

            try
            {
                Log("Iniciando creación de copia SQLite...");
                Batteries.Init();

                string dbPath = Path.Combine(Environment.CurrentDirectory, $"sigre_offline_{x_usuario}.db");

                GC.Collect();
                GC.WaitForPendingFinalizers();

                if (File.Exists(dbPath))
                {
                    try
                    {
                        File.Delete(dbPath);
                        Log($"Archivo previo eliminado: {dbPath}");
                    }
                    catch (IOException ioEx)
                    {
                        Log($"Advertencia: archivo en uso al intentar eliminar: {ioEx.Message}. Reintentando en 1s...");
                        Thread.Sleep(1000);
                        try
                        {
                            File.Delete(dbPath);
                            Log($"El archivo fue eliminado tras reintento: {dbPath}");
                        }
                        catch (Exception delEx)
                        {
                            Log($"ERROR al eliminar archivo: {delEx}");
                            throw;
                        }
                    }
                }

                using var ctx = new SigreContext();

                var dADeficiency = new DADeficiency();
                var dAFile = new DAFile();
                var dAGap = new DAGap();
                var dAPost = new DAPost();
                var dASed = new DASed();
                var dASwitch = new DASwitch();
                var dATypification = new DATypification();
                var dAUser = new DAUser();

                var pines = new List<PinStruct>();
                pines.AddRange(dADeficiency.DADEFI_GetPinsByFeeders(x_feeders));
                pines.AddRange(dAGap.DAGAP_GetPinsByFeeders(x_feeders));
                pines.AddRange(dAPost.DAPOST_PinsByFeeders(x_feeders));
                pines.AddRange(dASed.DASed_PinsByFeeders(x_feeders));
                pines.AddRange(dASwitch.DAEQUI_PinsByFeeders(x_feeders));

                var alimentadores = DAFE_GetFeedersByUser(x_usuario);
                var deficiencias = dADeficiency.DADEFI_GetByListFeeders(x_feeders);
                var archivos = dAFile.DAARCH_GetTableData();
                var vanos = dAGap.DAGAP_GetByListFeeder(x_feeders);
                var postes = dAPost.DAPOST_GetByListFeeder(x_feeders);
                var seds = dASed.DASed_GetByListFeeder(x_feeders);
                var switches = dASwitch.DAEQUI_GetByListFeeder(x_feeders);
                var tipificaciones = dATypification.DATIPI_GetByUser(x_usuario);
                var usuario = dAUser.DAUS_GetUser(x_usuario);
                var perfil = dAUser.DAUS_GetPerfilByUser(x_usuario);

                var armadoMaterial = ctx.ArmadoMaterials.Where(a => a.ArmmtActivo == true).ToList();
                var armadoTipo = ctx.ArmadoTipos.Where(a => a.ArmtpActivo == true).ToList();
                var retenidaTipo = ctx.RetenidaTipos.Where(r => r.RtntpActivo == true).ToList();
                var retenidaMaterial = ctx.RetenidaMaterials.Where(r => r.RtnmtActivo == true).ToList();
                var posteMaterial = ctx.PosteMaterials.Where(pm => pm.PostActivo == true).ToList();
                var sedMaterial = ctx.SedMaterials.Where(sm => sm.SedmtActivo == true).ToList();

                var sqliteOptions = new DbContextOptionsBuilder<SigreSqliteContext>()
                    .UseSqlite($"Data Source={dbPath}")
                    .Options;

                using (var sqliteCtx = new SigreSqliteContext(sqliteOptions))
                {
                    sqliteCtx.Database.EnsureDeleted();
                    sqliteCtx.Database.EnsureCreated();
                    sqliteCtx.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");

                    // --- VALIDAR colecciones antes de insertar ---
                    var allProblems = new List<string>();

                    allProblems.AddRange(ValidateEntitiesKeys(deficiencias, "Deficiencias"));
                    //allProblems.AddRange(ValidateEntitiesKeys(archivos, "Archivos"));
                    allProblems.AddRange(ValidateEntitiesKeys(vanos, "Vanos"));
                    allProblems.AddRange(ValidateEntitiesKeys(postes, "Postes"));
                    allProblems.AddRange(ValidateEntitiesKeys(seds, "Seds"));
                    allProblems.AddRange(ValidateEntitiesKeys(switches, "Switches"));
                    allProblems.AddRange(ValidateEntitiesKeys(tipificaciones, "Tipificaciones"));

                    // Para usuario/perfil (objetos únicos)
                    if (usuario == null) allProblems.Add("Usuario == null");
                    else
                    {
                        var uProblems = ValidateEntitiesKeys(new[] { usuario }, "Usuario");
                        allProblems.AddRange(uProblems);
                    }

                    if (perfil == null) allProblems.Add("Perfil == null");
                    else
                    {
                        var pProblems = ValidateEntitiesKeys(new[] { perfil }, "Perfil");
                        allProblems.AddRange(pProblems);
                    }

                    allProblems.AddRange(ValidateEntitiesKeys(armadoMaterial, "ArmadoMaterial"));
                    allProblems.AddRange(ValidateEntitiesKeys(armadoTipo, "ArmadoTipo"));
                    allProblems.AddRange(ValidateEntitiesKeys(retenidaTipo, "RetenidaTipo"));
                    allProblems.AddRange(ValidateEntitiesKeys(retenidaMaterial, "RetenidaMaterial"));
                    allProblems.AddRange(ValidateEntitiesKeys(posteMaterial, "PosteMaterial"));
                    allProblems.AddRange(ValidateEntitiesKeys(sedMaterial, "SedMaterial"));

                    // Pines: validar la clase PinStruct (si no es una entidad EF, detectarlo)
                    if (pines == null || !pines.Any())
                    {
                        Log("Pines está vacío o null.");
                    }
                    else
                    {
                        var pinProblems = ValidateEntitiesKeys(pines, "Pines");
                        allProblems.AddRange(pinProblems);
                    }

                    if (allProblems.Any())
                    {
                        Log("Se encontraron problemas antes de insertar en SQLite:");
                        foreach (var prob in allProblems)
                            Log("  - " + prob);

                        // No se arroja automáticamente; puedes decidir si quieres abortar aquí.
                        // Para propósitos de rastreo, continuamos e intentamos insertar (pero ya sabes qué revisar).
                    }
                    else
                    {
                        Log("No se encontraron problemas de keys detectables antes de insertar.");
                    }

                    // --- Insertar con try-catch por cada AddRange para saber qué colección falla ---
                    try
                    {
                        sqliteCtx.Deficiencias.AddRange(deficiencias ?? new List<Deficiencia>());
                        Log($"Deficiencias añadidas: {deficiencias?.Count() ?? 0}");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al AddRange Deficiencias: {ex}");
                        throw;
                    }

                    try
                    {
                        sqliteCtx.Vanos.AddRange(vanos ?? new List<Vano>());
                        Log($"Vanos añadidos: {vanos?.Count() ?? 0}");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al AddRange Vanos: {ex}");
                        throw;
                    }

                    try
                    {
                        sqliteCtx.Postes.AddRange(postes ?? new List<Poste>());
                        Log($"Postes añadidos: {postes?.Count() ?? 0}");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al AddRange Postes: {ex}");
                        throw;
                    }

                    try
                    {
                        sqliteCtx.Seds.AddRange(seds ?? new List<Sed>());
                        Log($"Seds añadidos: {seds?.Count() ?? 0}");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al AddRange Seds: {ex}");
                        throw;
                    }

                    try
                    {
                        sqliteCtx.Switches.AddRange(switches ?? new List<Equipo>());
                        Log($"Switches añadidos: {switches?.Count() ?? 0}");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al AddRange Switches: {ex}");
                        throw;
                    }

                    try
                    {
                        sqliteCtx.Tipificaciones.AddRange(tipificaciones ?? new List<TypificationStruct>());
                        Log($"Tipificaciones añadidas: {tipificaciones?.Count() ?? 0}");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al AddRange Tipificaciones: {ex}");
                        throw;
                    }

                    try
                    {
                        if (usuario != null) sqliteCtx.Usuarios.Add(usuario);
                        Log("Usuario añadido");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al añadir Usuario: {ex}");
                        throw;
                    }

                    try
                    {
                        if (perfil != null) sqliteCtx.Perfiles.Add(perfil);
                        Log("Perfil añadido");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al añadir Perfil: {ex}");
                        throw;
                    }

                    try
                    {
                        sqliteCtx.ArmadoMaterials.AddRange(armadoMaterial ?? new List<ArmadoMaterial>());
                        sqliteCtx.ArmadoTipos.AddRange(armadoTipo ?? new List<ArmadoTipo>());
                        sqliteCtx.RetenidaTipos.AddRange(retenidaTipo ?? new List<RetenidaTipo>());
                        sqliteCtx.RetenidaMaterials.AddRange(retenidaMaterial ?? new List<RetenidaMaterial>());
                        sqliteCtx.PosteMaterials.AddRange(posteMaterial ?? new List<PosteMaterial>());
                        sqliteCtx.SedMaterials.AddRange(sedMaterial ?? new List<SedMaterial>());
                        Log("Materiales y tipos añadidos");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al añadir materiales/tipos: {ex}");
                        throw;
                    }

                    // Pines: convertir si es necesario y añadir
                    try
                    {
                        var pinesEntities = pines.Select(p => new PinStruct
                        {
                            IdOriginal = p.Id,
                            IdAlimentador = p.IdAlimentador,
                            Label = p.Label,
                            Type = p.Type,
                            Latitude = p.Latitude,
                            Longitude = p.Longitude,
                            NodoInicial = p.NodoInicial,
                            NodoFinal = p.NodoFinal,
                            Inspeccionado = p.Inspeccionado,
                            ElementCode = !string.IsNullOrWhiteSpace(p.Label)
                                ? p.Label
                                : $"PIN_{Guid.NewGuid():N}" // Valor generado si viene nulo
                        }).ToList();

                        // Validar pines creados
                        var pinProblems2 = ValidateEntitiesKeys(pinesEntities, "PinesEntities");
                        if (pinProblems2.Any())
                        {
                            foreach (var prob in pinProblems2) Log("PIN PROBLEM: " + prob);
                        }

                        sqliteCtx.Pines.AddRange(pinesEntities);
                        Log($"Pines añadidos: {pinesEntities.Count}");
                    }
                    catch (Exception ex)
                    {
                        Log($"ERROR al AddRange Pines: {ex}");
                        throw;
                    }

                    // Finalmente SaveChanges con manejo detallado
                    try
                    {
                        sqliteCtx.SaveChanges();
                        Log($"✅ Copia SQLite creada correctamente en: {dbPath}");
                    }
                    catch (DbUpdateException dbEx)
                    {
                        Log("DbUpdateException en SaveChanges: " + dbEx.Message);
                        if (dbEx.InnerException != null) Log("InnerException: " + dbEx.InnerException.Message);
                        Log("StackTrace: " + dbEx.StackTrace);
                        throw;
                    }
                    catch (Exception ex)
                    {
                        Log("EXCEPCIÓN en SaveChanges: " + ex);
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Error al crear la base SQLite:");
                Console.WriteLine($"   Mensaje: {ex.Message}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine("🔍 --- INNER EXCEPTION ---");
                    Console.WriteLine($"Tipo: {ex.InnerException.GetType().FullName}");
                    Console.WriteLine($"Mensaje interno: {ex.InnerException.Message}");

                    if (ex.InnerException.InnerException != null)
                    {
                        Console.WriteLine("🔍 --- INNER INNER EXCEPTION ---");
                        Console.WriteLine($"Mensaje más profundo: {ex.InnerException.InnerException.Message}");
                    }
                }

                Console.WriteLine("📍 --- STACK TRACE ---");
                Console.WriteLine(ex.StackTrace);

                throw; // vuelve a lanzar para depuración si es necesario
            }
        }
    }
}
