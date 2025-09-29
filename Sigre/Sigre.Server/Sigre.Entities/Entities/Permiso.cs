using System;
using System.Collections.Generic;

namespace Sigre.Entities;

public partial class Permiso
{
    public int PermInterno { get; set; }

    public string PermReferencia { get; set; } = null!;

    public string PermNombre { get; set; } = null!;

    public bool? PermActivo { get; set; }

    public virtual ICollection<PermisosPerfile> PermisosPerfiles { get; } = new List<PermisosPerfile>();
}
