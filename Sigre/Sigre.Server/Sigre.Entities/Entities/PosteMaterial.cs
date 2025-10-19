using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class PosteMaterial
{
    [Key]
    public int PosmtInterno { get; set; }

    public string PosmtNombre { get; set; } = null!;

    public bool? PostActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();
}
