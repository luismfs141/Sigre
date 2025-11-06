using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class RetenidaTipo
{
    [Key]
    public int RtntpInterno { get; set; }

    public string RtntpNombre { get; set; } = null!;

    public bool? RtntpActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; } = new List<Sed>();
}
