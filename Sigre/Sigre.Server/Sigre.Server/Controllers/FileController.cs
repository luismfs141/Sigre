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

    }
}
