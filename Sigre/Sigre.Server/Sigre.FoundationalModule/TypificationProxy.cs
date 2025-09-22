using Sigre.Entities;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.FoundationModule
{
    public class TypificationProxy : ProxyBase
    {
        private const string RelativePath = "typification/";

        public static async Task<List<TypificationStruct>> GetAllAsync()
        {
            List<TypificationStruct> typifications = new List<TypificationStruct>();

            HttpResponseMessage response = await client.GetAsync(RelativePath + "GetAll");
            if (response.IsSuccessStatusCode)
            {
                string result = await response.Content.ReadAsStringAsync();
                typifications = Newtonsoft.Json.JsonConvert.DeserializeObject<List<TypificationStruct>>(result);
            }

            return typifications;
        }
    }
}
