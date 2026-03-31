using System.Collections.Generic;
using Sigre.Entities.Entities;

namespace Sigre.Entities.Structs
{
    public class FileStruct
    {
        public int IdElemento { get; set; }
        public string TipoElemento { get; set; } = null!;
        public string? CodigoElemento { get; set; }

        public string? CodigoTipificacion { get; set; }

        public string? Estado { get; set; }

        public List<Archivo> Archivos { get; set; } = new();

        public int CantFotos => Archivos.Count;
    }
}