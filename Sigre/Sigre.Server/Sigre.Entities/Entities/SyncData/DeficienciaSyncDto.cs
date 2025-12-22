using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class DeficienciaSyncDto
    {
        public int DefiInternoLocal { get; set; }   // ID local SQLite
        public int? DefiInterno { get; set; }       // ID servidor
        public int EstadoOffLine { get; set; }      // 1=UPDATE | 2=INSERT
        public List<ArchivoSyncDto> Archivos { get; set; } = new();

        public string? DefiEstado { get; set; }
        public int? InspInterno { get; set; }
        public int? TablInterno { get; set; }
        public string? DefiCodigoElemento { get; set; }
        public int? TipiInterno { get; set; }

        public string? DefiNumSuministro { get; set; }
        public DateTime? DefiFechaDenuncia { get; set; }
        public DateTime? DefiFechaInspeccion { get; set; }
        public DateTime? DefiFechaSubsanacion { get; set; }

        public string? DefiObservacion { get; set; }
        public string? DefiEstadoSubsanacion { get; set; }

        public double DefiLatitud { get; set; }
        public double DefiLongitud { get; set; }

        public string? DefiTipoElemento { get; set; }
        public int? DefiIdElemento { get; set; }

        public decimal? DefiDistHorizontal { get; set; }
        public decimal? DefiDistVertical { get; set; }
        public decimal? DefiDistTransversal { get; set; }

        public string? DefiCodDef { get; set; }
        public int? DefiCodRes { get; set; }
        public int? DefiCodDen { get; set; }

        public string? DefiRefer1 { get; set; }
        public string? DefiRefer2 { get; set; }

        public string? DefiNodoInicial { get; set; }
        public string? DefiNodoFinal { get; set; }

        public string? DefiTipoMaterial { get; set; }
        public string? DefiTipoRetenida { get; set; }
        public string? DefiRetenidaMaterial { get; set; }
        public string? DefiTipoArmado { get; set; }
        public string? DefiArmadoMaterial { get; set; }

        public int? DefiNumPostes { get; set; }
        public bool? DefiResponsable { get; set; }
        public bool DefiInspeccionado { get; set; }

        public string DefiUsuarioInic { get; set; } = null!;
        public string DefiUsuarioMod { get; set; } = null!;
        public DateTime DefiFecRegistro { get; set; }

    }

}
