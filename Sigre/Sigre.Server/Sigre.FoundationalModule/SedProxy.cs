using Sigre.Entities.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.FoundationModule
{
    public class SedProxy : ProxyBase
    {
        private const string RelativePath = "Sed/";
        public static async Task<List<ElementStruct>> GetByFeederAsync(int x_feeder_id)
        {
            List<ElementStruct> seds = new List<ElementStruct>();

            HttpResponseMessage response = await client.GetAsync(RelativePath + "GetStructByFeeder?x_feeder_id=" + x_feeder_id);
            if (response.IsSuccessStatusCode)
            {
                string result = await response.Content.ReadAsStringAsync();
                seds = Newtonsoft.Json.JsonConvert.DeserializeObject<List<ElementStruct>>(result);
            }
            return seds;
        }
    }
}
