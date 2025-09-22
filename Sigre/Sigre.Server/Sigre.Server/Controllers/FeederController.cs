using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeederController
    {
        [HttpGet("GetFeeder")]
        public List<Alimentadore> ObtenerFeeder()
        {
            DAFeeder dAFeeder = new DAFeeder();
            return dAFeeder.DAFeeder_Get();
        }

        [HttpGet("GetFeedersByIdPhone")]
        public List<Alimentadore> GetFeedersByIdPhone(string x_idPhone)
        {
            DAFeeder dAFeeder = new DAFeeder();
            return dAFeeder.DAFeedersByIdPhone(x_idPhone);
        }
        [HttpGet("GetFeedersByUser")]
        public List<Alimentadore> GetFeedersByUser(int idUser)
        {
            DAFeeder dAFeeder = new DAFeeder();
            return dAFeeder.DAFE_GetFeedersByUser(idUser);
        }

        [Route("saveByUser")]
        [HttpPost]
        public object SaveByUser(int idUser, int idAlim, bool act)
        {
            DAFeeder dAFeeder = new DAFeeder();
            dAFeeder.DAFE_SaveByUser(idUser, idAlim, act);

            return new
            {
                id = ""+idUser+idAlim,
                estado = "Satisfactorio",
                Mensaje = "Se guardó correctamente"
            };
        }
        [Route("drawMap")]
        [HttpPost]
        public object DrawMapByFeeder(int idFeeder)
        {
            DAFeeder dAFeeder = new DAFeeder();
            dAFeeder.DAFE_DrawMapByFeeder(idFeeder);

            return new
            {
                id = "" + idFeeder,
                estado = "Satisfactorio",
                Mensaje = "Mapa Actualizado"
            };
        }
    }
}
