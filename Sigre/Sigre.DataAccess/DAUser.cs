using BCrypt.Net;
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
    public class DAUser
    {
        //public List<Usuario> DAUS_GetUsers()
        //{
        //    SigreContext ctx = new SigreContext();

        //    var usuarios = ctx.Usuarios.OrderBy(u => u.UsuaEquipo).ToList();

        //    return usuarios;
        //}

        //public Usuario DAUS_GetUserByImei(string x_imei)
        //{
        //    SigreContext ctx = new SigreContext();

        //    var usuario = ctx.Usuarios.SingleOrDefault(u => u.UsuaImei==x_imei);

        //    return usuario;
        //}
        //public void DAUS_SaveUser(Usuario us)
        //{
        //    SigreContext ctx = new SigreContext();
        //    us.UsuaImei = us.UsuaImei.ToLower();

        //    if (us.UsuaInterno == 0)
        //    {
        //        ctx.Usuarios.Add(us);
        //    }
        //    else
        //    {
        //        Usuario usOriginal=ctx.Usuarios.SingleOrDefault(u => u.UsuaInterno == us.UsuaInterno);
        //        ctx.Entry(usOriginal).CurrentValues.SetValues(us);
        //    }
        //    ctx.SaveChanges(); 
        //}

        public void DAUS_SaveUser(Usuario us)
        {
            using var ctx = new SigreContext();

            // ⚠️ Solo generar hash si es usuario nuevo o cambia su contraseña
            if (!string.IsNullOrEmpty(us.UsuaPassword))
            {
                us.UsuaPassword = BCrypt.Net.BCrypt.HashPassword(us.UsuaPassword);
            }

            if (us.UsuaInterno == 0)
            {
                ctx.Usuarios.Add(us);
            }
            else
            {
                var usOriginal = ctx.Usuarios.SingleOrDefault(u => u.UsuaInterno == us.UsuaInterno);
                ctx.Entry(usOriginal).CurrentValues.SetValues(us);
            }
            ctx.SaveChanges();
        }

        public Usuario DAUS_LoginUser(string correo, string password, string imei)
        {
            SigreContext ctx = new SigreContext();

            var usuario = ctx.Usuarios.FirstOrDefault(u => u.UsuaCorreo == correo && u.UsuaActivo == true);
            if (usuario == null) return null;

            // Validar hash
            bool passwordOk = BCrypt.Net.BCrypt.Verify(password, usuario.UsuaPassword);
            if (!passwordOk) return null;

            var movil = ctx.Moviles.FirstOrDefault(m => m.MoviImei == imei && m.MoviActivo == true);
            if (movil == null) return null;

            return usuario;
        }

    }
}
