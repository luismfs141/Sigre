using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class PerfilesUsuario
{
    public int PfusInterno { get; set; }

    public int PfusUsuario { get; set; }

    public int PfusPerfil { get; set; }

    public bool PfusActivo { get; set; }

    public virtual Perfile PfusPerfilNavigation { get; set; } = null!;

    public virtual Usuario PfusUsuarioNavigation { get; set; } = null!;
}
