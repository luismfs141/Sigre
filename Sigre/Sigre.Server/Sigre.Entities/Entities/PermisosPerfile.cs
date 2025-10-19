using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;


namespace Sigre.Entities.Entities;

public partial class PermisosPerfile
{
    [Key]
    public int PmpfInterno { get; set; }

    public int PmpfPermiso { get; set; }

    public int PmpfPerfil { get; set; }

    public bool? PmpfActivo { get; set; }

    public virtual Perfile PmpfPerfilNavigation { get; set; } = null!;

    public virtual Permiso PmpfPermisoNavigation { get; set; } = null!;
}
