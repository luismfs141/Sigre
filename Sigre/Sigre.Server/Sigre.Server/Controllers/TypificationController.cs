using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TypificationController
    {
        [HttpGet("GetAll")]
        public List<TypificationStruct> GetAll()
        {
            DATypification dATypification = new DATypification();

            return dATypification.DATIPI_GetAll();
        }
    }
}
