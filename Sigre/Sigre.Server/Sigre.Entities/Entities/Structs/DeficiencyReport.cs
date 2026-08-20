using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.Structs
{
    public class DeficiencyReport
    {
        public string? Alimentador { get; set; }
        public string? Codigo{ get; set; }
        public string? Nodo1 { get; set; }
        public string? Nodo2 { get; set; }
        public string? TipoElemento { get; set; }
        public string? Altura { get; set; }
        public string? Armado { get; set; }
        public string? Material { get; set; }
        public List<TipificacionReport>? Tipificaciones { get; set; }
    }

    public class TipificacionReport
    {
        public string? CodTipificacion { get; set; }
        public bool? EsSeal { get; set; }
        public int? criticidad { get; set; }
        public string? RutaFotos{ get; set; }
    }
}
