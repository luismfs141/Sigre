using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.FoundationModule
{
    public class ProxyBase
    {
        public static HttpClient client = new HttpClient();

        public static async Task RunAsync()
        {
            // Update port # in the following line.
            client.BaseAddress = new Uri("http://localhost/sigrehost/api/");
            //client.BaseAddress = new Uri("https://sigreserver.azurewebsites.net/api/");
            //client.BaseAddress = new Uri("https://localhost:7280/api/");
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        }
    }
}
