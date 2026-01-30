using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PinController:Controller
     {
        [HttpGet("GetStructByFeeder")]
        public IActionResult GetStructByFeeder(int idFeeder)
        {
            try
            {
                DAPin da = new DAPin();

                // Tu DA pide una lista, así que envolvemos el ID único en una lista
                List<int> listaIds = new List<int> { idFeeder };

                var result = da.DAPOST_PinsByFeeders(listaIds);

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error interno: " + ex.Message });
            }
        }
        [HttpGet("GetPinsBySubestacion")]
        public IActionResult GetPinsBySubestacion(int idSed)
        {
            try
            {
                if (idSed <= 0) return BadRequest("ID inválido");

                DAPin da = new DAPin();

                // Llamada directa, sin crear listas
                var result = da.DAPOST_PinsBySubestacion(idSed);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
