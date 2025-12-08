using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Structs
{
    public class PinStruct
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int IdOriginal { get; set; }
        public string Label { get; set; }
        public ElectricElement Type { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int IdAlimentador { get; set; }
        public int? IdSed { get; set; }
        public string ElementCode { get; set; }
        public bool Inspeccionado { get; set; }
        public bool Tercero { get; set; }
        public string? NodoInicial { get; set; }
        public string? NodoFinal { get; set; }
    }
}
