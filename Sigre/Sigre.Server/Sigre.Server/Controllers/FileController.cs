using Microsoft.AspNetCore.Mvc;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities;
using System.IO;

namespace Sigre.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController
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
    }
}
