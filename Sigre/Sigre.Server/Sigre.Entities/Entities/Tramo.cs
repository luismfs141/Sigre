using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Tramo
{
    [Key]
    public int TramInterno { get; set; }

    public string TramCodigo { get; set; } = null!;

    public int TramOrden { get; set; }

    public bool? TramActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; set; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; set; } = new List<Sed>();

    public virtual ICollection<Vano> Vanos { get; set; } = new List<Vano>();
}
