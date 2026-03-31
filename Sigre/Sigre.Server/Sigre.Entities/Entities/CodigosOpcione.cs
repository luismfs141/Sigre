using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class CodigosOpcione
{
    public int CodopInterno { get; set; }

    public int CodiInterno { get; set; }

    public string CodopOpcion { get; set; } = null!;

    public string? CodopCol1 { get; set; }

    public string? CodopCol2 { get; set; }

    public virtual Codigo CodiInternoNavigation { get; set; } = null!;
}
