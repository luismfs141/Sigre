using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.Structs
{
    public class DeficiencyDto
    {
        public int DefiInterno { get; set; }
        public string? DefiEstado { get; set; }
        public int? TablInterno { get; set; }
        public string? DefiCodigoElemento { get; set; }
        public int? TipiInterno { get; set; }
        public string? DefiNumSuministro { get; set; }
        public DateTime? DefiFechaDenuncia { get; set; }
        public DateTime? DefiFechaInspeccion { get; set; }
        public DateTime? DefiFechaSubsanacion { get; set; }
        public string? DefiObservacion { get; set; }
        public string? DefiEstadoSubsanacion { get; set; }
        public double? DefiLatitud { get; set; }
        public double? DefiLongitud { get; set; }
        public string? DefiTipoElemento { get; set; }
        public decimal? DefiDistHorizontal { get; set; }
        public decimal? DefiDistVertical { get; set; }
        public decimal? DefiDistTransversal { get; set; }
        public int? DefiIdElemento { get; set; }
        public DateTime? DefiFecRegistro { get; set; }
        public string? DefiCodDef { get; set; }
        public string? DefiCodAmt { get; set; }
        public DateTime? DefiFecModificacion { get; set; }
        public DateTime? DefiFechaCreacion { get; set; }
        public string? DefiPozoTierra { get; set; }
        public bool? DefiResponsable { get; set; }
        public string? DefiComentario { get; set; }
        public string? DefiPozoTierra2 { get; set; }
        public string? DefiUsuarioInic { get; set; }
        public string? DefiUsuarioMod { get; set; }
        public bool? DefiActivo { get; set; }
        public int? DefiEstadoCriticidad { get; set; }
        public bool? DefiInspeccionado { get; set; }
        public string? DefiCol1 { get; set; }
        public string? DefiCol2 { get; set; }
        public string? DefiCol3 { get; set; }
    }
}
