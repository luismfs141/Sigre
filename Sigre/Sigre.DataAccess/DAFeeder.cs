using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
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
    }
}
