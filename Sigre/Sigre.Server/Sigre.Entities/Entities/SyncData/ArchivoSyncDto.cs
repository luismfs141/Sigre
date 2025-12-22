using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class ArchivoSyncDto
    {
        public int ArchInterno { get; set; } // siempre 0 desde offline
        public int ArchTipo { get; set; }
        public string ArchNombre { get; set; } = null!;
        public double? ArchLatitud { get; set; }
        public double? ArchLongitud { get; set; }
        public DateTime? ArchFecha { get; set; }
    }

}
