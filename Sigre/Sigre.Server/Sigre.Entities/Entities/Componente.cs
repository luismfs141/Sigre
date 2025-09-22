using System;
using System.Collections.Generic;

namespace Sigre.Entities;

public partial class Componente
{
    public int CompInterno { get; set; }

    public string CompComponente { get; set; } = null!;

    public int TablInterno { get; set; }

    public virtual ICollection<Codigo> Codigos { get; } = new List<Codigo>();

    public virtual Tabla TablInternoNavigation { get; set; } = null!;
}
