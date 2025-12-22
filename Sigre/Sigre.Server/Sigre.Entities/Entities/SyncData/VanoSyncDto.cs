using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class VanoSyncDto
    {
        public int VanoInternoLocal { get; set; }      // ID SQLite
        public int? VanoInterno { get; set; }          // ID servidor
        public int EstadoOffLine { get; set; }         // 1 = UPDATE | 2 = INSERT

        public string? VanoCodigo { get; set; }
        public string VanoEtiqueta { get; set; } = null!;

        public double VanoLatitudIni { get; set; }
        public double VanoLongitudIni { get; set; }
        public double VanoLatitudFin { get; set; }
        public double VanoLongitudFin { get; set; }

        public int AlimInterno { get; set; }

        public bool VanoTerceros { get; set; }
        public string? VanoMaterial { get; set; }

        public string? VanoNodoInicial { get; set; }
        public string? VanoNodoFinal { get; set; }

        public bool VanoInspeccionado { get; set; }

        public int? VanoSubestacion { get; set; }
        public bool? VanoEsMt { get; set; }
        public bool? VanoEsBt { get; set; }
    }

}
