using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PinController
     {
        //[HttpGet("GetByFeeder")]
        //public List<PinStruct> GetByFeeder(int x_feeder_id)
        //{
        //    List<PinStruct> pins = new List<PinStruct>();

        //    DASed dASed = new DASed();
        //    pins.AddRange(dASed.DASed_PinByFeeder(x_feeder_id));

        //    DAPost dAPoste = new DAPost();
        //    pins.AddRange(dAPoste.DAPOST_PinByFeeder(x_feeder_id));

        //    DASwitch dAEquipment = new DASwitch();
        //    pins.AddRange(dAEquipment.DAEQUI_PinByFeeder(x_feeder_id));

        //    DADeficiency dADeficiency = new DADeficiency();
        //    pins.AddRange(dADeficiency.DADEFI_GetPinsByFeeder(x_feeder_id));

        //    return pins;
        // }
    }
}
