using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class Archivo
{
    public int ArchInterno { get; set; }

    public string ArchTipo { get; set; } = null!;

    public string ArchTabla { get; set; } = null!;

    public int ArchCodTabla { get; set; }

    public string ArchNombre { get; set; } = null!;

    public double? ArchLatitud { get; set; }

    public double? ArchLongitud { get; set; }

    public DateTime? ArchFecha { get; set; }

    public bool? ArchActivo { get; set; }
}
