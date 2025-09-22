using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities;
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
    }
}
