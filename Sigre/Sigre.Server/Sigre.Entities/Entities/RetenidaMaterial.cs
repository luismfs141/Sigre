using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class RetenidaMaterial
{
    [Key]
    public int RtnmtInterno { get; set; }

    public string RtnmtNombre { get; set; } = null!;

    public bool? RtnmtActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; } = new List<Sed>();
}
