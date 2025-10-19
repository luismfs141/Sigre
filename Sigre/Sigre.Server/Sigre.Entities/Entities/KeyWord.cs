using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class KeyWord
{
    [Key]
    public int KeywInterno { get; set; }

    public int TipiInterno { get; set; }

    public string? KeywPalClave { get; set; }

    public virtual Tipificacione TipiInternoNavigation { get; set; } = null!;
}
