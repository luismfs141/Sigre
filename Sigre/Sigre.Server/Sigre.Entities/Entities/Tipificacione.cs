using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class Tipificacione
{
    public int TipiInterno { get; set; }

    public string TipoDescripcion { get; set; } = null!;

    public int CodiInterno { get; set; }

    public virtual Codigo CodiInternoNavigation { get; set; } = null!;

    public virtual ICollection<KeyWord> KeyWords { get; } = new List<KeyWord>();
}
