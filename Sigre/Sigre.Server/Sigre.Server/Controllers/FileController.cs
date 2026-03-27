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
            try
            {
                if (archivosOffline == null || archivosOffline.Count == 0)
                    return Ok(new List<object>());

                DAFile daFile = new DAFile();
                var result = daFile.DAARCH_SyncFromSQLite(archivosOffline);

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
        [HttpGet("GetByDeficiencyWeb")]
        public IActionResult GetByDeficiencyWeb([FromQuery] int x_deficiency)
        {
            try
            {
                // 1. Instancia de tu capa de datos (igual que tu ejemplo)
                DAFile dAFile = new DAFile(); // O DaArchivos, según donde pusiste el método corregido

                // 2. Validación básica
                if (x_deficiency <= 0)
                {
                    return BadRequest(new
                    {
                        estado = "Error",
                        mensaje = "El ID de la deficiencia es inválido."
                    });
                }

                // 3. Llamada al método que arreglamos (el que tiene .AsNoTracking o el Select manual)
                var listaArchivos = dAFile.DAARCH_GetByDeficiencyWeb(x_deficiency);

                // 4. Retorno exitoso
                // OJO: Aquí devuelvo la lista directa porque tu frontend (React) 
                // seguramente espera un Array [ ] para poder hacer el .map() de las fotos.
                return Ok(listaArchivos);
            }
            catch (Exception ex)
            {
                // 5. Tu estructura de error personalizada
                return BadRequest(new
                {
                    estado = "Error",
                    mensaje = ex.Message,
                    detalle = ex.InnerException?.Message
                });
            }
        }

       
      
            [HttpPost("move")]
            public async Task<IActionResult> MoveFileFisico([FromBody] MoveFileRequest request)
            {
                if (string.IsNullOrEmpty(request.OldPath) || string.IsNullOrEmpty(request.NewPath))
                {
                    return BadRequest(new { mensaje = "Las rutas origen y destino son obligatorias." });
                }

                try
                {
                    var daFile = new DAFile();
                    bool success = await daFile.MoverArchivoFisicoAsync(request.OldPath, request.NewPath);

                    return Ok(new { mensaje = "Archivo movido y renombrado con éxito en el servidor." });
                }
                catch (FileNotFoundException ex)
                {
                    return NotFound(new { mensaje = "Archivo original no encontrado", detalle = ex.Message });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { mensaje = "Error interno al mover el archivo", detalle = ex.Message });
                }
            
        }
        [HttpPost("OverwritePhysicalImage")]
        public async Task<IActionResult> OverwritePhysicalImage([FromForm] int archInterno, [FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "El frontend no envió ninguna imagen." });

                // Instanciamos tu capa DA (o la inyectas si usas Inyección de Dependencias)
                var daFile = new DAFile();

                // Ejecutamos la lógica física
                await daFile.OverwritePhysicalImageAsync(archInterno, file);

                return Ok(new { success = true, message = "Imagen reemplazada físicamente con éxito." });
            }
            catch (Exception ex)
            {
                // Aquí capturamos el error exacto que lanzó DAFile y lo mandamos al Front
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
