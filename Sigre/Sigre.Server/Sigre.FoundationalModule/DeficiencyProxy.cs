using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Structs;

namespace Sigre.FoundationModule
{
    public class DeficiencyProxy : ProxyBase
    {
        private const string RelativePath = "Deficiency/";

        public static async Task<List<DeficiencyStruct>> GetByFeederAsync(int x_feeder_id)
        {
            List<DeficiencyStruct> deficiencies = new List<DeficiencyStruct>();

            HttpResponseMessage response = await client.GetAsync(RelativePath + "GetByFeeder?x_feeder_id=" + x_feeder_id);
            if (response.IsSuccessStatusCode)
            {
                string result = await response.Content.ReadAsStringAsync();
                deficiencies = Newtonsoft.Json.JsonConvert.DeserializeObject<List<DeficiencyStruct>>(result);
            }
            return deficiencies;
        }
    }
}