using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class PosteMaterial
{
    public int PosmtInterno { get; set; }

    public string PosmtNombre { get; set; } = null!;

    public bool? PostActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();
}
