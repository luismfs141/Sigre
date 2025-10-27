using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeederController : ControllerBase
    {
        private readonly ILogger<FeederController> _logger;

        public FeederController(ILogger<FeederController> logger)
        {
            _logger = logger;
        }

        [HttpGet("GetFeeder")]
        public List<Alimentadore> ObtenerFeeder()
        {
            DAFeeder dAFeeder = new DAFeeder();
            return dAFeeder.DAFeeder_Get();
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
            dAFeeder.DAFE_SaveFeedersByUser(idUser, idAlim, act);

            return new
            {
                id = "" + idUser + idAlim,
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

        [HttpPost("export")]
        public async Task<IActionResult> ExportDatabase([FromBody] DatabaseExportRequest request)
        {
            try
            {
                DAFeeder dAFeeder = new DAFeeder();

                byte[] fileBytes = dAFeeder.DAFE_CreateDatabaseSqlite(request.Feeders, request.UserId);

                if (fileBytes == null || fileBytes.Length == 0)
                    return NotFound("No se generó el archivo SQLite.");

                return File(fileBytes, "application/octet-stream", "sigre_offline.db");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar la base SQLite");
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
    }
    public class DatabaseExportRequest
    {
        public int UserId { get; set; }
        public List<int> Feeders { get; set; } = new();
    }
}
