using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : ControllerBase
    {
        [HttpGet("GetStructByFeeder")]
        public List<ElementStruct> GetStructByFeeder( int x_feeder_id)
        {
            DAPost dAPost = new DAPost();
            return dAPost.DAPOST_GetStructByFeeder(x_feeder_id);
        }

        [HttpPost("GetPostByFeeders")]
        public List<Poste> GetPostByFeeders(List<int> feeders)
        {
            DAPost dAPost = new DAPost();

            return dAPost.DAPOST_GetByListFeeder(feeders);
        }

        // 🔁 SINCRONIZACIÓN SQLITE → SQL SERVER
        [HttpPost("SyncFromSQLite")]
        public IActionResult SyncFromSQLite([FromBody] List<PosteSyncDto> postesOffline)
        {
            DAPost _daPost = new DAPost();
            var result = _daPost.DAPOST_SyncFromSQLite(postesOffline);

            return Ok(result.Select(r => new
            {
                localId = r.localId,
                serverId = r.serverId
            }));
        }

    }
}
