using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GapController
    {
        [HttpGet("GetByFeeder")]
        public List<Vano> ObtenerGap(int x_feeder_id) {
            DAGap dAGap = new DAGap();
            return dAGap.DAGAP_GetByFeeder(x_feeder_id);
        }
        [HttpGet("GetStructByFeeder")]
        public List<ElementStruct> GetStructByFeeder(int x_feeder_id)
        {
            DAGap dAGap = new DAGap();
            return dAGap.DAGap_GetStructByFeeder(x_feeder_id);
        }
    }
}
