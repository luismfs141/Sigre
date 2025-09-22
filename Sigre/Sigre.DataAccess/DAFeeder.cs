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

        public List<Alimentadore> DAFeedersByIdPhone(string x_idPhone)
        {
            SigreContext ctx = new SigreContext();

            Usuario usuario = ctx.Usuarios.SingleOrDefault(u => u.UsuaImei == x_idPhone);
            
            if (usuario == null)
            {
                return new List<Alimentadore> { };
            }
            else if (usuario.AlimInterno == null)
            {
                var query = ctx.Alimentadores.ToList();
                return query;
            }
            else
            {
                int alimInterno = usuario.AlimInterno.Value;
                usuario = null;
                var query = ctx.Alimentadores.Where(a => a.AlimInterno == alimInterno).ToList();
                foreach(var item in query)
                {
                    item.Usuarios.Clear();
                }
                return query;
            }
        }

        public List<Alimentadore> DAFE_GetFeedersByUser(int id_user)
        {
            SigreContext ctx = new SigreContext();
            List<Alimentadore> feeders = new List<Alimentadore>();

            var users = ctx.UsrAlims.Where(u => u.UsuaInterno == id_user);


            foreach (var user in users)
            {
                Alimentadore feeder = ctx.Alimentadores.SingleOrDefault(a => a.AlimInterno == user.AlimInterno);

                if (feeder != null && !feeders.Contains(feeder))
                {
                    feeders.Add(feeder);
                }
            }

            return feeders;
        }

        public void DAFE_SaveByUser(int idUser,int idAlim, bool act)
        {
            SigreContext ctx = new SigreContext();

            var userAlim = ctx.UsrAlims.SingleOrDefault(ua => ua.UsuaInterno == idUser && ua.AlimInterno==idAlim);

            if(userAlim == null)
            {
                ctx.UsrAlims.Add(new UsrAlim { 
                    AlimInterno = idAlim,
                    UsuaInterno = idUser, 
                    UsraActivo = true});
            }
            else
            {
                ctx.Entry(userAlim).CurrentValues.SetValues(new UsrAlim
                {
                    AlimInterno = idAlim,
                    UsuaInterno = idUser,
                    UsraActivo = act
                });
            }
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
