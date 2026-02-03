using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class VanoSyncDto
    {
        public int? VanoInterno { get; set; }
        public int EstadoOffLine { get; set; }

        public string? VanoCodigo { get; set; }
        public double VanoLatitudIni { get; set; }
        public double VanoLongitudIni { get; set; }
        public double VanoLatitudFin { get; set; }
        public double VanoLongitudFin { get; set; }

        public int AlimInterno { get; set; }
        public string VanoEtiqueta { get; set; } = null!;
        public bool VanoTerceros { get; set; }
        public string? VanoMaterial { get; set; }
        public string? VanoNodoInicial { get; set; }
        public string? VanoNodoFinal { get; set; }
        public bool VanoInspeccionado { get; set; }
        public int? VanoSubestacion { get; set; }
        public bool? VanoEsMt { get; set; }
        public bool? VanoEsBt { get; set; }
        public string? VanoTramo { get; set; }
    }
}
