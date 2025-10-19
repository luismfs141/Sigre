using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class SedMaterial
{
    [Key]
    public int SedmtInterno { get; set; }

    public string SedmtNombre { get; set; } = null!;

    public bool? SedmtActivo { get; set; }
}
