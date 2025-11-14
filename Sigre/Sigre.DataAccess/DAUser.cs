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
        public List<Usuario> DAUS_GetUsers()
        {
            SigreContext ctx = new SigreContext();

            var usuarios = ctx.Usuarios.OrderBy(u => u.UsuaNombres).ToList();

            return usuarios;
        }

        public List<Perfile> DAUS_GetProfiles()
        {
            SigreContext ctx = new SigreContext();

            var perfiles = ctx.Perfiles.OrderBy(p => p.PerfNombre).ToList();

            return perfiles;
        }

        public Usuario DAUS_GetUser(int x_usuario)
        {
            SigreContext ctx = new SigreContext();

            Usuario usuario = ctx.Usuarios.SingleOrDefault(u => u.UsuaInterno == x_usuario);

            return usuario;
        }

        public void DAUS_SaveUser(Usuario us, List<int> perfiles)
        {
            using var ctx = new SigreContext();
            using var trans = ctx.Database.BeginTransaction();

            try
            {
                // 🔐 Hash de contraseña solo si se especifica
                if (!string.IsNullOrEmpty(us.UsuaPassword))
                {
                    us.UsuaPassword = BCrypt.Net.BCrypt.HashPassword(us.UsuaPassword);
                }

                // 🧩 Si es nuevo usuario
                if (us.UsuaInterno == 0)
                {
                    ctx.Usuarios.Add(us);
                    ctx.SaveChanges();
                }
                else
                {
                    // 🧱 Actualizar usuario existente
                    var usOriginal = ctx.Usuarios.SingleOrDefault(u => u.UsuaInterno == us.UsuaInterno);
                    if (usOriginal == null)
                        throw new Exception("Usuario no encontrado.");

                    ctx.Entry(usOriginal).CurrentValues.SetValues(us);
                    ctx.SaveChanges();
                }

                int usuarioId = us.UsuaInterno;

                // 🧾 Eliminar perfiles previos
                var perfilesPrevios = ctx.PerfilesUsuarios.Where(p => p.PfusUsuario == usuarioId);
                ctx.PerfilesUsuarios.RemoveRange(perfilesPrevios);

                // 🧾 Insertar nuevos perfiles
                foreach (var idPerfil in perfiles)
                {
                    ctx.PerfilesUsuarios.Add(new PerfilesUsuario
                    {
                        PfusUsuario = usuarioId,
                        PfusPerfil = idPerfil,
                        PfusActivo = true
                    });
                }

                ctx.SaveChanges();
                trans.Commit();
            }
            catch (Exception ex)
            {
                trans.Rollback();
                throw new Exception("Error al guardar usuario: " + ex.Message);
            }
        }

        public void DAUS_SaveUserFeeders(int usuario, List<int> alimentadores)
        {
            using var ctx = new SigreContext();
            using var trans = ctx.Database.BeginTransaction();

            try
            {
                // 🔹 Eliminar relaciones existentes
                var existentes = ctx.UsuariosAlimentadores
                    .Where(x => x.UsalUsuario == usuario)
                    .ToList();

                ctx.UsuariosAlimentadores.RemoveRange(existentes);

                // 🔹 Crear nuevas relaciones
                if (alimentadores != null && alimentadores.Count > 0)
                {
                    var nuevas = alimentadores.Select(id => new UsuariosAlimentadore
                    {
                        UsalUsuario = usuario,
                        UsalAlimentador = id
                    }).ToList();

                    ctx.UsuariosAlimentadores.AddRange(nuevas);
                }

                ctx.SaveChanges();
                trans.Commit();
            }
            catch (Exception ex)
            {
                trans.Rollback();
                throw new Exception("Error al guardar alimentadores del usuario: " + ex.Message);
            }
        }
        public Usuario DAUS_LoginUser(string correo, string password, string imei = null)
        {
            using var ctx = new SigreContext();

            var usuario = ctx.Usuarios.FirstOrDefault(u => u.UsuaCorreo == correo && u.UsuaActivo == true);
            if (usuario == null) return null;

            bool passwordOk = BCrypt.Net.BCrypt.Verify(password, usuario.UsuaPassword);
            if (!passwordOk) return null;

            // Validar IMEI solo si se envía
            if (!string.IsNullOrEmpty(imei))
            {
                var movil = ctx.Moviles.FirstOrDefault(m => m.MoviImei == imei && m.MoviActivo == true);
                if (movil == null) return null;
            }

            return usuario;
        }

        public Perfile DAUS_GetPerfilByUser(int x_usuario)
        {
            SigreContext ctx = new SigreContext();

            return (
                from pu in ctx.PerfilesUsuarios
                join p in ctx.Perfiles on pu.PfusPerfil equals p.PerfInterno
                where pu.PfusInterno == x_usuario
                select p
            ).FirstOrDefault();
        }
    }
}
