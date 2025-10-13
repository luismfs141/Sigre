using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
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
            string dbPath = Path.Combine(Environment.CurrentDirectory, $"sigre_offline_{x_usuario}.db");
            if (File.Exists(dbPath))
                File.Delete(dbPath);

            SigreContext ctx = new SigreContext();

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
            var switchs = dASwitch.DAEQUI_GetByListFeeder(x_feeders);
            var tipificaciones = dATypification.DATIPI_GetByUser(x_usuario);
            var usuario = dAUser.DAUS_GetUser(x_usuario);
            var perfil = dAUser.DAUS_GetPerfilByUser(x_usuario);

            // ⚙️ Materiales activos
            var armadoMaterial = ctx.ArmadoMaterials.Where(a => a.ArmmtActivo == true).ToList();
            var armadoTipo = ctx.ArmadoTipos.Where(a => a.ArmtpActivo == true).ToList();
            var retenidaTipo = ctx.RetenidaTipos.Where(r => r.RtntpActivo == true).ToList();
            var retenidaMaterial = ctx.RetenidaMaterials.Where(r => r.RtnmtActivo == true).ToList();
            var posteMaterial = ctx.PosteMaterials.Where(pm => pm.PostActivo == true).ToList();
            var sedMaterial = ctx.SedMaterials.Where(sm => sm.SedmtActivo == true).ToList();

            var sqliteBuilder = new SqliteConnectionStringBuilder { DataSource = dbPath };
            using var sqliteConn = new SqliteConnection(sqliteBuilder.ConnectionString);
            sqliteConn.Open();

            var sqliteOptions = new DbContextOptionsBuilder<SigreSqliteContext>()
                .UseSqlite(sqliteConn)
                .Options;

            using (var sqliteCtx = new SigreSqliteContext(sqliteOptions))
            {
                sqliteCtx.Database.EnsureCreated();
                sqliteCtx.Deficiencias.AddRange(deficiencias);
                sqliteCtx.Archivos.AddRange(archivos);
                sqliteCtx.Vanos.AddRange(vanos);
                sqliteCtx.Postes.AddRange(postes);
                sqliteCtx.Seds.AddRange(seds);
                sqliteCtx.Switches.AddRange(switchs);
                sqliteCtx.Tipificaciones.AddRange(tipificaciones);
                sqliteCtx.Usuarios.Add(usuario);
                sqliteCtx.Perfiles.Add(perfil);
                sqliteCtx.ArmadoMaterials.AddRange(armadoMaterial);
                sqliteCtx.ArmadoTipos.AddRange(armadoTipo);
                sqliteCtx.RetenidaTipos.AddRange(retenidaTipo);
                sqliteCtx.RetenidaMaterials.AddRange(retenidaMaterial);
                sqliteCtx.PosteMaterials.AddRange(posteMaterial);
                sqliteCtx.SedMaterials.AddRange(sedMaterial);

                var pinesEntities = pines.Select(p => new PinStruct
                {
                    Id = p.Id,
                    IdAlimentador = p.IdAlimentador,
                    Label = p.Label,
                    Type = p.Type,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    NodoInicial = p.NodoInicial,
                    NodoFinal = p.NodoFinal,
                    Inspeccionado = p.Inspeccionado
                }).ToList();

                sqliteCtx.Pines.AddRange(pinesEntities);

                sqliteCtx.SaveChanges();
            }

            Console.WriteLine($"✅ Copia SQLite creada con pines en: {dbPath}");
        }
    }
}
