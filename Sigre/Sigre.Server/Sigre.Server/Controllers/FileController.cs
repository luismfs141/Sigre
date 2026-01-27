using Microsoft.AspNetCore.Mvc;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.SyncData;
using System.IO;

namespace Sigre.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : Controller
    {
        [Route("UploadFile")]
        [HttpPost]
        public object UploadFile(Archivo x_file)
        {
            try
            {
                DAFile dAFile = new DAFile();
                dAFile.DAARCH_Save(x_file);

                return new
                {
                    id = x_file.ArchInterno,
                    estado = "Satisfactorio",
                    Mensaje = "Se guardó correctamente"
                };
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        [HttpGet("GetByDeficiency")]
        public List<Archivo> GetByElement(int x_deficiency)
        {
            DAFile dAFile = new DAFile();

            return dAFile.DAARCH_GetByDeficiency(x_deficiency);
        }

        [HttpGet("GetByFeeder")]
        public List<Archivo> GetByFeeder(int x_feeder_id)
        {
            DAFile dAFile = new DAFile();

            return dAFile.DAARCH_GetByFeeder(x_feeder_id);
        }

        [HttpPost("SyncFromSQLite")]
        public IActionResult SyncFromSQLite([FromBody] List<ArchivoSyncDto> archivosOffline)
        {
            DAFile dAFile = new DAFile();

            if (archivosOffline == null || archivosOffline.Count == 0)
                return Ok(new List<object>());

            var result = dAFile.DAARCH_SyncFromSQLite(archivosOffline);

            var response = result.Select(r => new
            {
                localId = r.localId,
                serverId = r.serverId
            });

            return Ok(response);
        }
        [HttpPost("SoftDelete")]
        public IActionResult SoftDelete(int id)
        {
            try
            {
                DAFile da = new DAFile();
                bool result = da.DAFILE_SoftDelete(id);
                if (result) return Ok(new { message = "Archivo desactivado correctamente" });
                return NotFound("Archivo no encontrado");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        // En Sigre.Server/Controllers/FileController.cs

        [HttpPost("UploadFileInWeb")]
        public IActionResult UploadFileInWeb([FromBody] Archivo archivo)
        {
            try
            {
                DAFile da = new DAFile();

                // Validaciones preventivas
                if (archivo == null) return BadRequest("El archivo no puede ser nulo.");

                // Si la fecha viene vacía, ponemos la actual del servidor
                if (archivo.ArchFecha == DateTime.MinValue) archivo.ArchFecha = DateTime.Now;

                // Aseguramos que se guarde como activo
                archivo.ArchActivo = true;

                // ✅ USAMOS EL NUEVO MÉTODO ESPECÍFICO PARA WEB
                da.DAARCH_SaveInWeb(archivo);

                return Ok(true);
            }
            catch (Exception ex)
            {
                // Tip: Devuelve el error interno para que puedas verlo en la consola del navegador si falla
                return BadRequest($"Error en servidor: {ex.Message} | {ex.InnerException?.Message}");
            }
        }

        [HttpPost("UpdateCodTablaBySed")]
        public IActionResult UpdateCodTablaBySed([FromQuery] string codigoSed)
        {
            try
            {
                DAFile dAFile = new DAFile();
                if (string.IsNullOrWhiteSpace(codigoSed))
                    return BadRequest("El código de la SED es obligatorio.");

                dAFile.DADEFI_UpdateCodTablaBySed(codigoSed);

                return Ok(new
                {
                    estado = "Satisfactorio",
                    mensaje = "Deficiencias actualizadas correctamente",
                    codigoSed
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    estado = "Error",
                    mensaje = ex.Message,
                    detalle = ex.InnerException?.Message
                });
            }
        }

    }
}
