using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.Structs
{
    public class UsuarioRequest
    {
        public int UsuaInterno { get; set; }
        public string UsuaNombres { get; set; }
        public string UsuaApellidos { get; set; }
        public string UsuaCorreo { get; set; }
        public string? UsuaPassword { get; set; }
        public bool UsuaActivo { get; set; }

        public List<int> Perfiles { get; set; } = new();
    }
}
