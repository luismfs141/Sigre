using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class ArmadoMaterial
{
    [Key]
    public int ArmmtInterno { get; set; }

    public string ArmmtNombre { get; set; } = null!;

    public bool? ArmmtActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; } = new List<Sed>();
}
