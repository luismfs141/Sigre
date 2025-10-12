using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class RetenidaMaterial
{
    public int RtnmtInterno { get; set; }

    public string RtnmtNombre { get; set; } = null!;

    public bool? RtnmtActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; } = new List<Sed>();
}
