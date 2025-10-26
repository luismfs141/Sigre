using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Structs
{
    public class OffLineStruct
    {
        public List<Deficiencia>? Deficiencies { get; set; }
        public List<Archivo>? Files { get; set; }
    }
}
