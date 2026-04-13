using System;

namespace Sigre.Entities.Entities.SyncData
{
    public class PosteSyncDto
    {
        public int? PostInterno { get; set; }
        public int PostInternoLocal { get; set; }
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
        public string? PostTramo { get; set; }
        public bool PostVereda { get; set; }

        public int? EsgoInterno { get; set; }
    }
}