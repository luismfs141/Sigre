using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Movile
{
    [Key]
    public int MoviInterno { get; set; }

    public string MoviNombre { get; set; } = null!;

    public string? MoviMarca { get; set; }

    public string? MoviModelo { get; set; }

    public string MoviImei { get; set; } = null!;

    public string? MoviDescripcion { get; set; }

    public bool MoviCorporativo { get; set; }

    public bool? MoviActivo { get; set; }
}
