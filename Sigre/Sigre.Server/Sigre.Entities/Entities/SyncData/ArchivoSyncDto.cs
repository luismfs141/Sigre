using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class ArchivoSyncDto
    {
        public int ArchInterno { get; set; }
        public int? ArchServerId { get; set; }

        public string ArchTipo { get; set; }   // 👈 STRING
        public string ArchTabla { get; set; }
        public int? ArchCodTabla { get; set; }

        public string ArchNombre { get; set; }

        public double? ArchLatitud { get; set; }
        public double? ArchLongitud { get; set; }

        public DateTime? ArchFecha { get; set; }

        public string ArchTipoElemento { get; set; }
        public int? ArchIdElemento { get; set; }
        public int? TipiInterno { get; set; }

        public bool ArchActivo { get; set; }
        public int EstadoOffLine { get; set; }

        public int? DefiServerId { get; set; }
        public string? DefiUUID { get; set; }

    }


}
