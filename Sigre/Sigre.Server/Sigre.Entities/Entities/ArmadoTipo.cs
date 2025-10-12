using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class ArmadoTipo
{
    public int ArmtpInterno { get; set; }

    public string ArmtpNombre { get; set; } = null!;

    public bool? ArmtpActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; } = new List<Sed>();
}
