using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
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

        [HttpPost("GetGapsByFeeders")]
        public List<Vano> GetGapsByFeeders(List<int> feeders)
        {
            DAGap dAGap = new DAGap();

            int? feeder1 = feeders.ElementAtOrDefault(0);
            int? feeder2 = feeders.ElementAtOrDefault(1);
            int? feeder3 = feeders.ElementAtOrDefault(2);

            return dAGap.DAGAP_GetByListFeeder(feeder1, feeder2, feeder3);
        }
    }
}
