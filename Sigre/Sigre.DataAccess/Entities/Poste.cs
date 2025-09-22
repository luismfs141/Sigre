using System;
using System.Collections.Generic;

namespace Sigre.DataAccess.Entities;

public partial class Poste
{
    public int PostInterno { get; set; }

    public string PostEtiqueta { get; set; } = null!;

    public double? PostLatitud { get; set; }

    public double? PostLongitud { get; set; }

    public int AlimInterno { get; set; }

    public string? PostCodigoNodo { get; set; }

    public bool PostTerceros { get; set; }

    public string? PostMaterial { get; set; }

    public bool PostInspeccionado { get; set; }
}
