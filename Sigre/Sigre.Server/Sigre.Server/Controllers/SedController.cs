using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SedController : Controller
    {
        [HttpGet("GetByFeeder")]
        public List<PinStruct> ObtenerSed([FromQuery] int x_Alim_Id)
        {
            DASed dASed = new DASed();
            return dASed.DASed_PinByFeeder(x_Alim_Id);
        }

        [HttpGet("GetStructByFeeder")]
        public List<ElementStruct> GetStructByFeeder([FromQuery] int x_feeder_id)
        {
            DASed dASed = new DASed();
            return dASed.DASed_GetStructByFeeder(x_feeder_id);
        }
    }
}