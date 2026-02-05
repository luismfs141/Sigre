using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Entities.SyncData;
using System.Threading.Tasks;

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

            var deficiencias = await daOffline.DAOFF_LeerDeficienciasDesdeSqlite(file);

            var archivos = await daOffline.DAOFF_LeerArchivosDesdeSqliteAsync(file);

            return Ok(new
            {
                deficiencias,
                archivos
            });
        }

        /* ============================
          SINCRONIZAR SQLITE
          ============================ */
        [HttpPost("sync")]
        [Consumes("multipart/form-data")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
        public async Task<IActionResult> SyncData([FromForm(Name = "file")] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Archivo inválido");

            if (!file.FileName.EndsWith(".db"))
                return BadRequest("Solo se permiten archivos SQLite (.db)");

            try
            {
                var daOffline = new DAOffline();

                // 🔑 Ejecutar sincronización
                var (
                    defInsertadas,
                    defModificadas,
                    archInsertados,
                    archModificados
                ) = await daOffline.DAOFF_SyncDataOffline(file);

                return Ok(new
                {
                    success = true,

                    deficiencias = new
                    {
                        insertadas = defInsertadas,
                        modificadas = defModificadas,
                        total = defInsertadas + defModificadas
                    },

                    archivos = new
                    {
                        insertados = archInsertados,
                        modificados = archModificados,
                        total = archInsertados + archModificados
                    },

                    mensaje = "Sincronización completada correctamente"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Error durante la sincronización",
                    detalle = ex.Message
                });
            }
        }

    }
}
