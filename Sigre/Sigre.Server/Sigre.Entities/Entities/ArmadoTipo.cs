using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class ArmadoTipo
{
    [Key]
    public int ArmtpInterno { get; set; }

    public string ArmtpNombre { get; set; } = null!;

    public bool? ArmtpActivo { get; set; }

    public virtual ICollection<Poste> Postes { get; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; } = new List<Sed>();
}
