using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class Vano
{
    public int VanoInterno { get; set; }

    public string? VanoCodigo { get; set; }

    public double VanoLatitudIni { get; set; }

    public double VanoLongitudIni { get; set; }

    public double VanoLatitudFin { get; set; }

    public double VanoLongitudFin { get; set; }

    public int AlimInterno { get; set; }

    public string VanoEtiqueta { get; set; } = null!;

    public bool VanoTerceros { get; set; }

    public string? VanoMaterial { get; set; }

    public string? VanoNodoInicial { get; set; }

    public string? VanoNodoFinal { get; set; }

    public bool VanoInspeccionado { get; set; }

    public virtual Alimentadore AlimInternoNavigation { get; set; } = null!;
}
