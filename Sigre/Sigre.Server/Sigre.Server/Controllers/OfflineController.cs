using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/offline")]
    public class OfflineController : ControllerBase
    {
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadSqlite(
            [FromForm(Name = "file")] IFormFile file
        )
        {
            if (file == null || file.Length == 0)
                return BadRequest("Archivo inválido");

            if (!file.FileName.EndsWith(".db"))
                return BadRequest("Solo se permiten archivos SQLite (.db)");

            var daOffline = new DAOffline();
            var data = await daOffline.LeerDeficienciasDesdeSqliteAsync(file);

            return Ok(data);
        }
    }
}
