using Sigre.DataAccess.Context;
using Sigre.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DAUser
    {
        public List<Usuario> DAUS_GetUsers()
        {
            SigreContext ctx = new SigreContext();

            var usuarios = ctx.Usuarios.OrderBy(u => u.UsuaEquipo).ToList();

            return usuarios;
        }

        public Usuario DAUS_GetUserByImei(string x_imei)
        {
            SigreContext ctx = new SigreContext();

            var usuario = ctx.Usuarios.SingleOrDefault(u => u.UsuaImei==x_imei);

            return usuario;
        }
        public void DAUS_SaveUser(Usuario us)
        {
            SigreContext ctx = new SigreContext();
            us.UsuaImei = us.UsuaImei.ToLower();

            if (us.UsuaInterno == 0)
            {
                ctx.Usuarios.Add(us);
            }
            else
            {
                Usuario usOriginal=ctx.Usuarios.SingleOrDefault(u => u.UsuaInterno == us.UsuaInterno);
                ctx.Entry(usOriginal).CurrentValues.SetValues(us);
            }
            ctx.SaveChanges(); 
        }

        public Usuario DAUS_LoginUsuario()
        {
            return new Usuario();
        }
    }
}
