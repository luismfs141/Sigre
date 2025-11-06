using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Componente
{
    [Key]
    public int CompInterno { get; set; }

    public string CompComponente { get; set; } = null!;

    public int TablInterno { get; set; }

    public virtual ICollection<Codigo> Codigos { get; } = new List<Codigo>();

    public virtual Tabla TablInternoNavigation { get; set; } = null!;
}
