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
        private static readonly object _sqliteLock = new object();
        public List<Alimentadore> DAFeeder_Get()
        {
            SigreContext ctx = new SigreContext();
            List<Alimentadore> feeders = ctx.Alimentadores.OrderBy(a => a.AlimCodigo).ToList();

            return feeders;
        }

        public List<Alimentadore> DAFeeder_GetFeederById(List<int> idAlimentadores)
        {
            SigreContext ctx = new SigreContext();

            if (idAlimentadores == null || idAlimentadores.Count == 0)
                return new List<Alimentadore>();

            // Obtener alimentadores cuyos IDs estén en la lista
            var feeders = ctx.Alimentadores
                             .Where(a => idAlimentadores.Contains(a.AlimInterno))
                             .ToList();

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

        public byte[] DAFE_CreateDatabaseSqlite(List<int> x_feeders, int x_usuario)
        {
            try
            {
                Batteries.Init();

                // --- 1️⃣ Crear conexión SQLite en memoria ---
                using var connection = new SqliteConnection("Data Source=:memory:");
                connection.Open();

                var options = new DbContextOptionsBuilder<SigreSqliteContext>()
                    .UseSqlite(connection)
                    .Options;

                // --- 2️⃣ Crear y llenar la base en memoria ---
                using (var sqliteCtx = new SigreSqliteContext(options))
                {
                    sqliteCtx.Database.EnsureCreated();
                    sqliteCtx.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");

                    // --- Obtener datos de la base principal ---
                    using var ctx = new SigreContext();

                    var dADeficiency = new DADeficiency();
                    var dAGap = new DAGap();
                    var dAPost = new DAPost();
                    var dASed = new DASed();
                    var dASwitch = new DASwitch();
                    var dATypification = new DATypification();
                    var dAUser = new DAUser();
                    var dAFile = new DAFile();
                    var dAFeeder = new DAFeeder();

                    var pines = new List<PinStruct>();
                    pines.AddRange(dADeficiency.DADEFI_GetPinsByFeeders(x_feeders));
                    pines.AddRange(dAGap.DAGAP_GetPinsByFeeders(x_feeders));
                    pines.AddRange(dAPost.DAPOST_PinsByFeeders(x_feeders));
                    pines.AddRange(dASed.DASed_PinsByFeeders(x_feeders));
                    pines.AddRange(dASwitch.DAEQUI_PinsByFeeders(x_feeders));

                    var deficiencias = dADeficiency.DADEFI_GetByListFeeders(x_feeders);
                    var vanos = dAGap.DAGAP_GetByListFeeder(x_feeders);
                    var postes = dAPost.DAPOST_GetByListFeeder(x_feeders);
                    var seds = dASed.DASed_GetByListFeeder(x_feeders);
                    var switches = dASwitch.DAEQUI_GetByListFeeder(x_feeders);
                    var tipificaciones = dATypification.DATIPI_GetByUser(x_usuario);
                    var usuario = dAUser.DAUS_GetUser(x_usuario);
                    var perfil = dAUser.DAUS_GetPerfilByUser(x_usuario);
                    var archivos = dAFile.DAARCH_GetByFeeders(x_feeders);
                    var alimentadores = dAFeeder.DAFeeder_GetFeederById(x_feeders);

                    // Materiales
                    var armadoMaterial = ctx.ArmadoMaterials.Where(a => a.ArmmtActivo == true).ToList();
                    var armadoTipo = ctx.ArmadoTipos.Where(a => a.ArmtpActivo == true).ToList();
                    var retenidaTipo = ctx.RetenidaTipos.Where(r => r.RtntpActivo == true).ToList();
                    var retenidaMaterial = ctx.RetenidaMaterials.Where(r => r.RtnmtActivo == true).ToList();
                    var posteMaterial = ctx.PosteMaterials.Where(pm => pm.PostActivo == true).ToList();
                    var sedMaterial = ctx.SedMaterials.Where(sm => sm.SedmtActivo == true).ToList();

                    // --- Insertar datos en SQLite in-memory ---
                    sqliteCtx.Deficiencias.AddRange(deficiencias);
                    sqliteCtx.Vanos.AddRange(vanos);
                    sqliteCtx.Postes.AddRange(postes);
                    sqliteCtx.Seds.AddRange(seds);
                    sqliteCtx.Switches.AddRange(switches);
                    sqliteCtx.Tipificaciones.AddRange(tipificaciones);
                    sqliteCtx.Archivos.AddRange(archivos);
                    sqliteCtx.Alimentadores.AddRange(alimentadores);

                    if (usuario != null) sqliteCtx.Usuarios.Add(usuario);
                    if (perfil != null) sqliteCtx.Perfiles.Add(perfil);

                    sqliteCtx.ArmadoMaterials.AddRange(armadoMaterial);
                    sqliteCtx.ArmadoTipos.AddRange(armadoTipo);
                    sqliteCtx.RetenidaTipos.AddRange(retenidaTipo);
                    sqliteCtx.RetenidaMaterials.AddRange(retenidaMaterial);
                    sqliteCtx.PosteMaterials.AddRange(posteMaterial);
                    sqliteCtx.SedMaterials.AddRange(sedMaterial);

                    var pinesEntities = pines.Select(p => new PinStruct
                    {
                        IdOriginal = p.Id,
                        IdAlimentador = p.IdAlimentador,
                        Label = string.IsNullOrWhiteSpace(p.Label) ? $"PIN_{Guid.NewGuid():N}" : p.Label,
                        Type = p.Type,
                        Latitude = p.Latitude,
                        Longitude = p.Longitude,
                        NodoInicial = p.NodoInicial,
                        NodoFinal = p.NodoFinal,
                        Inspeccionado = p.Inspeccionado,
                        ElementCode = string.IsNullOrWhiteSpace(p.Label) ? $"PIN_{Guid.NewGuid():N}" : p.Label
                    }).ToList();

                    sqliteCtx.Pines.AddRange(pinesEntities);

                    sqliteCtx.SaveChanges();
                }

                // --- 3️⃣ Exportar la DB de memoria a byte[] usando VACUUM INTO ---
                string tempFile = Path.Combine(Path.GetTempPath(), $"sigre_offline_{Guid.NewGuid():N}.db");

                using (var exportCmd = connection.CreateCommand())
                {
                    exportCmd.CommandText = $"VACUUM INTO '{tempFile.Replace("\\", "\\\\")}'";
                    exportCmd.ExecuteNonQuery();
                }

                // Leer archivo a memoria
                byte[] fileBytes = File.ReadAllBytes(tempFile);

                // Borrar archivo temporal
                File.Delete(tempFile);

                return fileBytes;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error en creación de SQLite in-memory: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"🔍 Inner: {ex.InnerException.Message}");
                throw;
            }
        }
    }
}
