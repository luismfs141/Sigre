using BCrypt.Net;
using Sigre.DataAccess.Context;
using Sigre.Entities;
using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

using Sigre.Entities.Entities.Structs;
using Microsoft.EntityFrameworkCore;

using Sigre.Entities.Entities.Structs;

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
            using var ctx = new SigreContext();

            return ctx.Usuarios
                .AsNoTracking()
                .SingleOrDefault(u => u.UsuaInterno == x_usuario);
        }

        public void DAUS_SaveUser(Usuario us, List<int> perfiles)
        {
            using var ctx = new SigreContext();
            using var trans = ctx.Database.BeginTransaction();

            try
            {
                bool hasNewPassword = !string.IsNullOrWhiteSpace(us.UsuaPassword);

                // 🧩 Si es nuevo usuario => contraseña obligatoria
                if (us.UsuaInterno == 0)
                {
                    if (!hasNewPassword)
                        throw new Exception("La contraseña es obligatoria para un usuario nuevo.");

                    // 🔐 Hash password (nuevo)
                    us.UsuaPassword = BCrypt.Net.BCrypt.HashPassword(us.UsuaPassword.Trim());

                    ctx.Usuarios.Add(us);
                    ctx.SaveChanges(); // aquí ya se genera UsuaInterno
                }
                else
                {
                    // 🧱 Actualizar usuario existente
                    var usOriginal = ctx.Usuarios.SingleOrDefault(u => u.UsuaInterno == us.UsuaInterno);
                    if (usOriginal == null)
                        throw new Exception("Usuario no encontrado.");

                    // ✅ Si NO viene password => mantener el actual (NO tocar)
                    if (!hasNewPassword)
                    {
                        us.UsuaPassword = usOriginal.UsuaPassword; // preserva
                    }
                    else
                    {
                        // ✅ Si viene password => hashear y actualizar
                        us.UsuaPassword = BCrypt.Net.BCrypt.HashPassword(us.UsuaPassword.Trim());
                    }

                    // Actualiza campos
                    ctx.Entry(usOriginal).CurrentValues.SetValues(us);

                    // ✅ EXTRA SEGURIDAD: si no hay password nuevo, EF no debe marcarlo modificado
                    if (!hasNewPassword)
                    {
                        ctx.Entry(usOriginal).Property(x => x.UsuaPassword).IsModified = false;
                    }

                    ctx.SaveChanges();
                }

                int usuarioId = us.UsuaInterno;

                // ✅ Si tu regla es 1 usuario = 1 perfil:
                int? nuevoPerfilId = perfiles?.FirstOrDefault(); // toma el primero
                if (nuevoPerfilId == null || nuevoPerfilId <= 0)
                    throw new Exception("Seleccione un perfil válido.");

                // 1) Desactivar cualquier otro perfil activo extra (por si hay basura histórica)
                var activos = ctx.PerfilesUsuarios
                    .Where(x => x.PfusUsuario == usuarioId && x.PfusActivo == true)
                    .ToList();

                foreach (var a in activos)
                {
                    a.PfusActivo = false;
                }

                // 2) Buscar el registro “principal” (si ya existe alguno, lo reutilizamos)
                var rel = ctx.PerfilesUsuarios
                    .OrderByDescending(x => x.PfusInterno)
                    .FirstOrDefault(x => x.PfusUsuario == usuarioId);

                // 3) Si existe: UPDATE (no cambia PFUS_Interno)
                if (rel != null)
                {
                    rel.PfusPerfil = nuevoPerfilId.Value;
                    rel.PfusActivo = true;
                }
                else
                {
                    // 4) Si no existe: INSERT (solo en el primer registro del usuario)
                    ctx.PerfilesUsuarios.Add(new PerfilesUsuario
                    {
                        PfusUsuario = usuarioId,
                        PfusPerfil = nuevoPerfilId.Value,
                        PfusActivo = true
                    });
                }

                ctx.SaveChanges();

                trans.Commit();
            }
            catch (Exception ex)
            {
                trans.Rollback();

                // ✅ devuelve mensaje real (inner) para que NO te salga el genérico
                var msg = ex.InnerException?.Message ?? ex.Message;
                throw new Exception("Error al guardar usuario: " + msg);
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
            using var ctx = new SigreContext();

            return (
                from pu in ctx.PerfilesUsuarios
                join p in ctx.Perfiles on pu.PfusPerfil equals p.PerfInterno
                where pu.PfusUsuario == x_usuario      // ✅ CORRECTO
                      && pu.PfusActivo == true
                      && p.PerfActivo == true
                select p
            ).FirstOrDefault();
        }

        public List<UsuarioListDto> DAUS_GetUsersWithProfile()
        {
            using var ctx = new SigreContext();

            var usuarios = ctx.Usuarios.AsNoTracking().ToList();
            var rels = ctx.PerfilesUsuarios.AsNoTracking().ToList();
            var perfiles = ctx.Perfiles.AsNoTracking().ToList();

            // ✅ por usuario: elige el perfil "más representativo"
            // preferimos PFUS_Activo=1, si no hay, usamos el último (por PFUS_Interno)
            var relByUser = rels
                .GroupBy(r => r.PfusUsuario)
                .Select(g => g
                    .OrderByDescending(x => x.PfusActivo)      // activo primero
                    .ThenByDescending(x => x.PfusInterno)      // luego el más nuevo
                    .First())
                .ToDictionary(x => x.PfusUsuario, x => x);

            var perfMap = perfiles.ToDictionary(p => p.PerfInterno, p => p);

            var list = usuarios.Select(u =>
            {
                relByUser.TryGetValue(u.UsuaInterno, out var rel);

                Perfile? p = null;
                if (rel != null) perfMap.TryGetValue(rel.PfusPerfil, out p);

                return new UsuarioListDto
                {
                    UsuaInterno = u.UsuaInterno,
                    UsuaNombres = u.UsuaNombres ?? "",
                    UsuaApellidos = u.UsuaApellidos ?? "",
                    UsuaCorreo = u.UsuaCorreo ?? "",
                    UsuaActivo = u.UsuaActivo ?? true,

                    PerfilId = rel?.PfusPerfil,
                    PerfilNombre = p?.PerfNombre
                };
            })
            // ✅ ORDEN: activos primero, luego inactivos; 2do orden alfabético
            .OrderByDescending(x => x.UsuaActivo)
            .ThenBy(x => x.UsuaNombres)
            .ThenBy(x => x.UsuaApellidos)
            .ToList();

            return list;
        }

        public void DAUS_SetUserActive(int usuarioId, bool activo)
        {
            using var ctx = new SigreContext();

            var u = ctx.Usuarios.SingleOrDefault(x => x.UsuaInterno == usuarioId);
            if (u == null) throw new Exception("Usuario no encontrado.");

            u.UsuaActivo = activo;
            ctx.SaveChanges();
        }


    }


}
