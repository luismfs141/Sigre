using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class PosteSyncDto
    {
        public int? PostInterno { get; set; }      // ID servidor (si existe)
        public int PostInternoLocal { get; set; }  // ID SQLite
        public int EstadoOffLine { get; set; }
        public string PostEtiqueta { get; set; }
        public string PostCodigoNodo { get; set; }
        public double? PostLatitud { get; set; }
        public double? PostLongitud { get; set; }
        public int AlimInterno { get; set; }
        public int? PostMaterial { get; set; }
        public int? PostArmadoTipo { get; set; }
        public int? PostArmadoMaterial { get; set; }
        public int? PostRetenidaTipo { get; set; }
        public int? PostRetenidaMaterial { get; set; }
        public int? PostSubestacion { get; set; }
        public bool PostTerceros { get; set; }
        public bool PostInspeccionado { get; set; }
        public bool PostEsBt { get; set; }
        public bool PostEsMt { get; set; }
        public decimal? PostAltura { get; set; }

    }

}
