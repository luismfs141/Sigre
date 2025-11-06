using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;


namespace Sigre.Entities.Entities;

public partial class Permiso
{
    [Key]
    public int PermInterno { get; set; }

    public string PermReferencia { get; set; } = null!;

    public string PermNombre { get; set; } = null!;

    public bool? PermActivo { get; set; }

    public virtual ICollection<PermisosPerfile> PermisosPerfiles { get; } = new List<PermisosPerfile>();
}
