using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class Ordene
{
    public int OrdeInterno { get; set; }

    public string? OrdeCodigo { get; set; }

    public int? OrdeCodAmt { get; set; }

    public DateTime? OrdeFechaOrd { get; set; }
}
