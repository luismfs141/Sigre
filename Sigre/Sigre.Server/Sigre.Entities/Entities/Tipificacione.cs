using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Tipificacione
{
    [Key]
    public int TipiInterno { get; set; }

    public string TipoDescripcion { get; set; } = null!;

    public int CodiInterno { get; set; }

    public virtual Codigo CodiInternoNavigation { get; set; } = null!;

    public virtual ICollection<KeyWord> KeyWords { get; } = new List<KeyWord>();
}
