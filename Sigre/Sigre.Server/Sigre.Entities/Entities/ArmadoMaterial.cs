using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class ArmadoMaterial
{
    public int ArmmtInterno { get; set; }

    public string ArmmtNombre { get; set; } = null!;

    public bool? ArmmtActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; } = new List<Sed>();
}
