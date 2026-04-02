using System;

namespace Sigre.Entities.Entities.SyncData
{
    public class ArchivoSyncDto
    {
        public int ArchInterno { get; set; }

        public string ArchTipo { get; set; }
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
        public string? DefiUuid { get; set; }

        public Guid? ArchUuid { get; set; }
        public int? EsgoInterno { get; set; }
    }
}