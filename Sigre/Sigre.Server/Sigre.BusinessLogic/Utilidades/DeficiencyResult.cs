using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.BusinessLogic.Utilidades
{
    public class DeficiencyResult
    {
        public string NombreHoja { get; set; } = string.Empty;
        public string Alimentador { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Orden { get; set; } = string.Empty;
        public Dictionary<ConfigReport.TipoFila, string> DatosGenerales { get; set; } = new();
        public Dictionary<ConfigReport.TipoFila, string> DatosElemento { get; set; } = new();
        public List<ConfigReport.TipoFila> Deficiencias { get; set; } = new();
    }
}
