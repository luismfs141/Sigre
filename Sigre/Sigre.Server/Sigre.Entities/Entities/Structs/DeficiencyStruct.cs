using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.Structs
{
    public class DeficiencyStruct
    {
        public int IdElemento { get; set; }
        public string? Usuario { get; set; }
        public string? Alimentador { get; set; }
        public string? FechaInspeccion { get; set; }
        public string? TipoElemento { get; set; }
        public string? TipoArmado { get; set; }
        public string? ArmadoMaterial { get; set; }
        public string? Etiqueta { get; set; }
        public string? NodoAnterior { get; set; }
        public string? NodoPosterior { get; set; }
        public string? Tipificacion { get; set; }
        public List<Archivo>? Fotos { get; set; }
        public Usuario? User { get; set; }
        public string? Label { get; set; }
    }
}
