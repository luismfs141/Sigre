using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using Sigre.BusinessLogic.Principal;
using Sigre.BusinessLogic.Vano;
using Sigre.DataAccess;
using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GapController : Controller
    {
        [HttpGet("GetByFeeder")]
        public List<Vano> ObtenerGap(int x_feeder_id)
        {
            DAGap dAGap = new DAGap();
            return dAGap.DAGAP_GetByFeeder(x_feeder_id);
        }
        //[HttpGet("GetStructByFeeder")]
        //public List<ElementStruct> GetStructByFeeder(int x_feeder_id)
        //{
        //    DAGap dAGap = new DAGap();
        //    return dAGap.DAGap_GetStructByFeeder(x_feeder_id);
        //}

        [HttpPost("GetGapsByFeeders")]
        public List<Vano> GetGapsByFeeders(List<int> feeders)
        {
            DAGap dAGap = new DAGap();

            return dAGap.DAGAP_GetByListFeeder(feeders);
        }

        [HttpPost("SyncFromSQLite")]
        public IActionResult SyncFromSQLite([FromBody] List<VanoSyncDto> vanosOffline)
        {
            try
            {
                if (vanosOffline == null || vanosOffline.Count == 0)
                    return Ok(new List<object>());

                DAGap daGap = new DAGap();
                var result = daGap.DAVANO_SyncFromSQLite(vanosOffline);

                return Ok(result.Select(r => new
                {
                    localId = r.localId,
                    serverId = r.serverId
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("GetGapsBySubestacion")]
        public IActionResult GetGapsBySubestacion(int idSed)
        {
            try
            {
                DAGap da = new DAGap();


                var result = da.DAGAP_GetGapsBySubestacion(idSed);

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }
        [HttpPost("GuardarVanoWeb")]
        public IActionResult GuardarVanoWeb([FromBody] VanoGuardarDTO x_vano_dto)
        {
            try
            {
                // 1. EL MAPEO: Convertimos el DTO a la Entidad Vano
                var entidadVano = new Vano
                {
                    VanoInterno = x_vano_dto.VanoInterno,
                    VanoCodigo = x_vano_dto.VanoCodigo,
                    VanoEtiqueta = x_vano_dto.VanoEtiqueta,
                    AlimInterno = x_vano_dto.AlimInterno,
                    VanoSubestacion = x_vano_dto.VanoSubestacion,
                    VanoLatitudIni = x_vano_dto.VanoLatitudIni,
                    VanoLongitudIni = x_vano_dto.VanoLongitudIni,
                    VanoLatitudFin = x_vano_dto.VanoLatitudFin,
                    VanoLongitudFin = x_vano_dto.VanoLongitudFin,
                    VanoNodoInicial = x_vano_dto.VanoNodoInicial,
                    VanoNodoFinal = x_vano_dto.VanoNodoFinal,
                    VanoMaterial = x_vano_dto.VanoMaterial,
                    VanoTerceros = x_vano_dto.VanoTerceros
                };

                var da = new DAGap();

                // 2. Pasamos la ENTIDAD mapeada, no el DTO
                int idResultante = da.DAVANO_GuardarWeb(entidadVano);

                return Ok(idResultante);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al procesar Vano",
                    detalleTecnico = ex.Message
                });
            }
        }
        [HttpGet("GetByFeederWeb")]
        public IActionResult GetByFeederWeb(int x_feeder_id)
        {
            try
            {
                if (x_feeder_id <= 0)
                {
                    return BadRequest("El ID del alimentador no es válido.");
                }

                DAGap da = new DAGap();

                // Llamada al método optimizado
                List<Vano> listaVanos = da.DAVano_GetByFeederWeb(x_feeder_id);

                return Ok(listaVanos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error interno al obtener los vanos.",
                    detalle = ex.Message
                });
            }
        }
        [HttpGet("GetBySedWeb")]
        public IActionResult GetBySedWeb(int idSed)
        {
            try
            {
                if (idSed <= 0) return BadRequest("ID de SED inválido.");

                DAGap da = new DAGap();
                var result = da.DAGAP_GetBySedWeb(idSed);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        [HttpGet("GetPaginado")]
        // 🔥 NUEVO: Se agregan los [FromQuery] y los nuevos parámetros opcionales
        public IActionResult GetPaginado(int skip, int take, string codigo = "", string etiqueta = "", int? alimentadorId = null, int? sedId = null)
        {
            try
            {
                // Instancia tu capa de datos
                DAGap da = new DAGap();

                // 🔥 NUEVO: Le pasamos todos los parámetros, incluyendo los opcionales
                var result = da.DAGAP_GetPaginado(skip, take, codigo, etiqueta, alimentadorId, sedId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error", error = ex.Message });
            }
        }

        [HttpPost("AgregarTramosAlReporte")]
        [Consumes("multipart/form-data")]
        public IActionResult AgregarTramosAlReporte(IFormFile file, int alimInterno)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Debe enviar un archivo Excel.");

            try
            {
                ExcelPackage.License.SetNonCommercialPersonal("Sigre");

                using var stream = file.OpenReadStream();
                using var package = new ExcelPackage(stream);

                var daGap = new DAGap();

                var workbook = daGap.DAGAP_AgregarTramosAlReporte(package.Workbook, alimInterno);

                using var output = new MemoryStream();

                package.SaveAs(output);
                output.Position = 0;

                string nombreArchivo = Path.GetFileNameWithoutExtension(file.FileName)
                    + "_tramos"
                    + Path.GetExtension(file.FileName);

                return File(
                    output.ToArray(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    nombreArchivo);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Error al agregar los tramos al reporte: {ex.Message}");
            }
        }
    }
}
