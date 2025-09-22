using System;
using System.Collections.Generic;

namespace Sigre.DataAccess.Entities;

public partial class Codigo
{
    public int CodiInterno { get; set; }

    public string CodiCodigo { get; set; } = null!;

    public string CodiDeficiencia { get; set; } = null!;

    public int CompInterno { get; set; }

    public virtual Componente CompInternoNavigation { get; set; } = null!;

    public virtual ICollection<Tipificacione> Tipificaciones { get; } = new List<Tipificacione>();
}
