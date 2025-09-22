using System;
using System.Collections.Generic;

namespace Sigre.Entities;
public partial class Sed
{
    public int SedInterno { get; set; }
    public string SedEtiqueta { get; set; }
    public double SedLatitud { get; set; }
    public double SedLongitud { get; set; }
    public string SedTipo { get; set; }
    public int AlimInterno { get; set; }
    public string SedCodigo { get; set; }
    public string SedSimbolo { get; set; }
    public bool SedTerceros { get; set; }
    public string? SedMaterial { get; set; }
    public bool SedInspeccionado { get; set; }
}
