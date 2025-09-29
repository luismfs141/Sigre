using System;
using System.Collections.Generic;

namespace Sigre.Entities;

public partial class UsuariosAlimentadore
{
    public int UsalInterno { get; set; }

    public int UsalUsuario { get; set; }

    public int UsalAlimentador { get; set; }

    public bool? UsalActivo { get; set; }

    public virtual Alimentadore UsalAlimentadorNavigation { get; set; } = null!;

    public virtual Usuario UsalUsuarioNavigation { get; set; } = null!;
}
