using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Structs
{
    public class FileStruct
    {
        public string Table { get; set; }
        public string ElectricElement { get; set; }
        public string DeficiencyCode { get; set; }
        public string DeficiencyType { get; set; }
        public string PhotoType { get; set; }
        public string PhotoName { get; set; }
        public IFormFile FormFile { get; set; }
    }
}
