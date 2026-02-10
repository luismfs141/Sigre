using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Sigre.DataAccess;
using Sigre.Entities.Entities.SyncData;
using System.Threading.Tasks;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/offline")]
    public class OfflineController : ControllerBase
    {
        private async Task<string> CrearTempSqlite(IFormFile file)
        {
            var tempFile = Path.GetTempFileName();

            using (var stream = System.IO.File.Create(tempFile))
            {
                await file.CopyToAsync(stream);
            }

            return tempFile;
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadSqlite([FromForm(Name = "file")] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Archivo inválido");

            if (!file.FileName.EndsWith(".db"))
                return BadRequest("Solo se permiten archivos SQLite (.db)");

            var daOffline = new DAOffline();
            var tempFile = await CrearTempSqlite(file);

            try
            {
                var deficiencias =
                    await daOffline.DAOFF_LeerDeficienciasDesdeSqlite(tempFile);

                var archivos =
                    await daOffline.DAOFF_LeerArchivosDesdeSqliteAsync(tempFile);

                return Ok(new
                {
                    deficiencias,
                    archivos
                });
            }
            finally
            {
            }
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

            var daOffline = new DAOffline();
            var tempFile = await CrearTempSqlite(file);

            try
            {
                var result =
                    await daOffline.DAOFF_SyncDataOffline(tempFile);

                return Ok(new
                {
                    success = true,
                    mensaje = "Sincronización completada correctamente",
                    deficiencias = new
                    {
                        insertadas = result.defInsertadas,
                        modificadas = result.defModificadas
                    },
                    archivos = new
                    {
                        insertados = result.archInsertados,
                        modificados = result.archModificados
                    }
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
            finally
            {
                try
                {
                    SqliteConnection.ClearAllPools();
                    GC.Collect();
                    GC.WaitForPendingFinalizers();

                    if (System.IO.File.Exists(tempFile))
                        System.IO.File.Delete(tempFile);
                }
                catch
                {
                    // ignorar
                }
            }
        }

    }
}
