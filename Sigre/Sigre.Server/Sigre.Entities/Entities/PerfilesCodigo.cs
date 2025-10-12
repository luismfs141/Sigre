using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class PerfilesCodigo
{
    public int PfcdInterno { get; set; }

    public int PfcdPerfil { get; set; }

    public int PfcdCodigo { get; set; }

    public bool? PfcdActivo { get; set; }

    public virtual Codigo PfcdCodigoNavigation { get; set; } = null!;

    public virtual Perfile PfcdPerfilNavigation { get; set; } = null!;
}
