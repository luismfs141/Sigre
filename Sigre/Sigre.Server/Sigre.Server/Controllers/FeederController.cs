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
        [HttpGet("GetSedsByFeederWeb")]
        public IActionResult GetSedsByFeederWeb(int x_feeder)
        {
            try
            {
                DAFeeder dAFeeder = new DAFeeder();

                // Obtenemos la lista limpia desde la capa de datos
                var seds = dAFeeder.DAFE_GetSedsByFeederWeb(x_feeder);

                // ¡Aquí SÍ va el Ok()! Envía la lista a React formateada como JSON
                return Ok(seds);
            }
            catch (Exception ex)
            {
                // Si algo falla, le decimos a React exactamente qué fue
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
        [HttpGet("GetTramosPorSed")]
        public IActionResult GetTramosPorSed(int sedId)
        {
            try
            {
                DAFeeder daFeeder = new DAFeeder();
                var resultado = daFeeder.DAFE_GetTramosPorSed(sedId);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }



        [HttpPost("export")]
        public async Task<IActionResult> ExportDatabase([FromBody] DatabaseExportRequest request)
        {
            try
            {
                DAFeeder dAFeeder = new DAFeeder();

                //BAJA TENSION
                if(request.Project == 0)
                {
                    byte[] fileBytes = dAFeeder.DAFE_CreateDatabaseSqliteBT(
                    request.Ids,
                    request.UserId
                    );

                    if (fileBytes == null || fileBytes.Length == 0)
                        return NotFound("No se generó el archivo SQLite.");

                    // Nombre dinámico
                    string fileName = string.IsNullOrEmpty(request.FileName)
                        ? "sigre_offline.db"
                        : request.FileName;

                    return File(fileBytes, "application/octet-stream", fileName);
                }

                //MEDIA TENSION
                else
                {
                    byte[] fileBytes = dAFeeder.DAFE_CreateDatabaseSqlite(
                    request.Ids,
                    request.UserId
                    );

                    if (fileBytes == null || fileBytes.Length == 0)
                        return NotFound("No se generó el archivo SQLite.");

                    // Nombre dinámico
                    string fileName = string.IsNullOrEmpty(request.FileName)
                        ? "sigre_offline.db"
                        : request.FileName;

                    return File(fileBytes, "application/octet-stream", fileName);
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar la base SQLite");
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("GetSedsByFeeder")]
        public List<Sed> GetSedsByFeeder(int x_feeder)
        {
            DAFeeder dAFeeder = new DAFeeder();
            return dAFeeder.DAFE_GetSedsByFeeder(x_feeder);
        }
    }

    public class DatabaseExportRequest
    {
        public int UserId { get; set; }
        public List<int> Ids { get; set; } = new();
        public int Project { get; set; }

        public string FileName { get; set; }
    }
}
