using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Structs
{
    public class PinStruct
    {
        public int Id { get; set; }
        public string Label { get; set; }
        public ElectricElement Type { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int IdAlimentador { get; set; }
        public string ElementCode { get; set; }
        public bool Inspeccionado { get; set; }
        public bool Tercero { get; set; }
        public string? NodoInicial { get; set; }
        public string? NodoFinal { get; set; }
    }
}
