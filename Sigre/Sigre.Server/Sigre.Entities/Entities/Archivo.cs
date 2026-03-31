using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Archivo
{
    [Key]
    public int ArchInterno { get; set; }

    public string ArchTipo { get; set; } = null!;

    public string ArchTabla { get; set; } = null!;

    public int ArchCodTabla { get; set; }

    public string ArchNombre { get; set; } = null!;

    public double? ArchLatitud { get; set; }

    public double? ArchLongitud { get; set; }

    public DateTime? ArchFecha { get; set; }

    public string? ArchTipoElemento { get; set; }

    public int? ArchIdElemento { get; set; }

    public int? TipiInterno { get; set; }

    public bool ArchActivo { get; set; }

    public string? DefiUuid { get; set; }

    public Guid? ArchUuid { get; set; }

    public int? EsgoInterno { get; set; }

    public virtual EstadosGlobal? EsgoInternoNavigation { get; set; }
}

public class MoveFileRequest
{
    public string OldPath { get; set; }
    public string NewPath { get; set; }
}
