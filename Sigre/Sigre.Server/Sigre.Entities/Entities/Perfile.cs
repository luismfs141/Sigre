using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Perfile
{
    [Key]
    public int PerfInterno { get; set; }

    public string PerfNombre { get; set; } = null!;

    public bool? PerfActivo { get; set; }

    public virtual ICollection<PerfilesCodigo> PerfilesCodigos { get; } = new List<PerfilesCodigo>();

    public virtual ICollection<PerfilesUsuario> PerfilesUsuarios { get; } = new List<PerfilesUsuario>();

    public virtual ICollection<PermisosPerfile> PermisosPerfiles { get; } = new List<PermisosPerfile>();
}
