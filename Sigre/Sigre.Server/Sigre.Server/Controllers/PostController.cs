using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigre.DataAccess;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : ControllerBase
    {
        [HttpGet("GetStructByFeeder")]
        public List<ElementStruct> GetStructByFeeder(int x_feeder_id)
        {
            DAPost dAPost = new DAPost();
            return dAPost.DAPOST_GetStructByFeeder(x_feeder_id);
        }

        [HttpPost("GetPostByFeeders")]
        public List<Poste> GetPostByFeeders(List<int> feeders)
        {
            DAPost dAPost = new DAPost();

            return dAPost.DAPOST_GetByListFeeder(feeders);
        }

        // 🔁 SINCRONIZACIÓN SQLITE → SQL SERVER
        [HttpPost("SyncFromSQLite")]
        public IActionResult SyncFromSQLite([FromBody] List<PosteSyncDto> postesOffline)
        {
            DAPost _daPost = new DAPost();
            var result = _daPost.DAPOST_SyncFromSQLite(postesOffline);

            return Ok(result.Select(r => new
            {
                localId = r.localId,
                serverId = r.serverId
            }));
        }
        [HttpPost("GuardarPosteWeb")] // Nombre genérico
        public IActionResult GuardarPosteWeb([FromBody] Poste x_poste)
        {
            try
            {
                var da = new DAPost(); // Tu clase de acceso a datos

                // El método decide automáticamente si crea o edita
                int idResultante = da.DAPOST_GuardarWeb(x_poste);

                return Ok(idResultante);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al procesar el Poste",
                    detalleTecnico = ex.Message
                });
            }
        }
        [HttpGet("GetByFeederWeb")]
        public IActionResult GetByFeederWeb(int x_feeder_id)
        {
            try
            {
                // 1. Validación básica
                if (x_feeder_id <= 0)
                {
                    return BadRequest("El ID del alimentador no es válido.");
                }

                // 2. Instancia de la capa de datos
                DAPost da = new DAPost();

                // 3. Llamada al método optimizado (sin Navigation properties)
                List<Poste> listaPostes = da.DAPoste_GetByFeeder(x_feeder_id);

                // 4. Retorno exitoso (200 OK)
                return Ok(listaPostes);
            }
            catch (Exception ex)
            {
                // 5. Manejo de errores (500 Internal Server Error)
                return StatusCode(500, new
                {
                    mensaje = "Error interno al obtener los postes.",
                    detalle = ex.Message
                });
            }
        }
        [HttpGet("GetBySedWebWeb")]
        public IActionResult GetBySedWeb(int idSed)
        {
            try
            {
                if (idSed <= 0) return BadRequest("ID de SED inválido.");

                DAPost da = new DAPost();
                var result = da.DAPoste_GetBySedWeb(idSed);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        [HttpGet("GetPaginado")]
        public IActionResult GetPaginado(int skip, int take, string codigo = "", string etiqueta = "", int? alimentadorId = null, int? sedId = null)
        {
            try
            {
                // 1. Instanciamos al cocinero (Usando el nombre correcto de tu clase: DAPost)
                DAPost da = new DAPost();

                // 2. Le pasamos el pedido completo (¡AQUÍ LE PASAMOS LOS FILTROS!)
                var resultado = da.DAPoste_GetPaginado(skip, take, codigo, etiqueta, alimentadorId, sedId);

                // 3. Entregamos el plato
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
