using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostController
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

            int? feeder1 = feeders.ElementAtOrDefault(0);
            int? feeder2 = feeders.ElementAtOrDefault(1);
            int? feeder3 = feeders.ElementAtOrDefault(2);

            return dAPost.DAPOST_GetByListFeeder(feeder1, feeder2, feeder3);
        }
    }
}
