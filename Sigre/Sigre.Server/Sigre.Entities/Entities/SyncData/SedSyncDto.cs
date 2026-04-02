namespace Sigre.Entities.Entities.SyncData
{
    public class SedSyncDto
    {
        public int SedInterno { get; set; }
        public string? SedEtiqueta { get; set; }
        public double? SedLatitud { get; set; }
        public double? SedLongitud { get; set; }
        public string? SedTipo { get; set; }
        public int? AlimInterno { get; set; }
        public string? SedCodigo { get; set; }
        public string? SedSimbolo { get; set; }
        public bool? SedTerceros { get; set; }
        public string? SedMaterial { get; set; }
        public bool? SedInspeccionado { get; set; }
        public int? SedNumPostes { get; set; }
        public string? SedArmadoTipo { get; set; }
        public string? SedArmadoMaterial { get; set; }
        public string? SedRetenidaTipo { get; set; }
        public string? SedRetenidaMaterial { get; set; }

        public int? EsgoInterno { get; set; }
        public int? EstadoOffLine { get; set; }
    }
}