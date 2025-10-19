using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Codigo
{
    [Key]
    public int CodiInterno { get; set; }

    public string CodiCodigo { get; set; } = null!;

    public string CodiDeficiencia { get; set; } = null!;

    public int CompInterno { get; set; }

    public virtual Componente CompInternoNavigation { get; set; } = null!;

    public virtual ICollection<PerfilesCodigo> PerfilesCodigos { get; } = new List<PerfilesCodigo>();

    public virtual ICollection<Tipificacione> Tipificaciones { get; } = new List<Tipificacione>();
}
