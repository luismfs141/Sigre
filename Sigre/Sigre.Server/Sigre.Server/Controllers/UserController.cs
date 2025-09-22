using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController
    {
        [HttpGet ("GetUsers")]
        public List<Usuario> GetUsuarios()
        {
            DAUser dAUser = new DAUser();

            return dAUser.DAUS_GetUsers();
        }
        [HttpGet("GetUserByImei")]
        public Usuario GetUsuarioByImei(string x_imei)
        {
            DAUser user = new DAUser();
            return user.DAUS_GetUserByImei(x_imei);
        }
        [Route("save")]
        [HttpPost]
        public object Save(Usuario usuario)
        {
            DAUser dAUser = new DAUser();
            dAUser.DAUS_SaveUser(usuario);

            return new
            {
                id = usuario.UsuaInterno,
                estado = "Satisfactorio",
                Mensaje = "Se guardó correctamente"
            };
        }
    }
}
