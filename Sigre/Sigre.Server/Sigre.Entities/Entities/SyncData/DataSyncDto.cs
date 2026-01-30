using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class DataSyncDto
    {
        public DeficienciaSyncDto? Deficiencia { get; set; }
        public List<ArchivoSyncDto>? Archivos { get; set; }
    }
}
