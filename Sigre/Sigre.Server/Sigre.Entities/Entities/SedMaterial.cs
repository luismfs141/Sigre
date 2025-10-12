using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class SedMaterial
{
    public int SedmtInterno { get; set; }

    public string SedmtNombre { get; set; } = null!;

    public bool? SedmtActivo { get; set; }
}
