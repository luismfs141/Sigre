using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities
{
    public class EstadosGlobal
    {
        [Key]
        public int EsgoInterno { get; set; }

        public string EsgoNombre { get; set; }

        public string EsgoColor { get; set; }

        public string EsgoDescripcion { get; set; }

        public string EsgoTabla { get; set; }

        public bool EsgoActivo { get; set; }

        public ICollection<Poste> Postes { get; set; }

        public ICollection<Vano> Vanos { get; set; }

        public ICollection<Sed> Seds { get; set; }

        public ICollection<Deficiencia> Deficiencias { get; set; }

        public ICollection<Archivo> Archivos { get; set; }
    }
}
