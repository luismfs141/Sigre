using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GapController : Controller
    {
        [HttpGet("GetByFeeder")]
        public List<Vano> ObtenerGap(int x_feeder_id) {
            DAGap dAGap = new DAGap();
            return dAGap.DAGAP_GetByFeeder(x_feeder_id);
        }
        //[HttpGet("GetStructByFeeder")]
        //public List<ElementStruct> GetStructByFeeder(int x_feeder_id)
        //{
        //    DAGap dAGap = new DAGap();
        //    return dAGap.DAGap_GetStructByFeeder(x_feeder_id);
        //}

        [HttpPost("GetGapsByFeeders")]
        public List<Vano> GetGapsByFeeders(List<int> feeders)
        {
            DAGap dAGap = new DAGap();

            return dAGap.DAGAP_GetByListFeeder(feeders);
        }

        [HttpPost("SyncFromSQLite")]
        public IActionResult SyncFromSQLite([FromBody] List<VanoSyncDto> vanosOffline)
        {
            DAGap dAGap = new DAGap();

            if (vanosOffline == null || vanosOffline.Count == 0)
                return BadRequest("Lista vacía");

            var result = dAGap.DAVANO_SyncFromSQLite(vanosOffline);

            return Ok(result.Select(r => new
            {
                localId = r.localId,
                serverId = r.serverId
            }));
        }
        [HttpGet("GetGapsBySubestacion")]
        public IActionResult GetGapsBySubestacion(int idSed)
        {
            try
            {
                DAGap da = new DAGap();


                var result = da.DAGAP_GetGapsBySubestacion(idSed);

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }
    }
}
