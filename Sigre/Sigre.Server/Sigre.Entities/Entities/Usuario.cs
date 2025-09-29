using System;
using System.Collections.Generic;

namespace Sigre.Entities;

public partial class Usuario
{
    public int UsuaInterno { get; set; }

    public string UsuaNombres { get; set; } = null!;

    public string UsuaApellidos { get; set; } = null!;

    public string UsuaCorreo { get; set; } = null!;

    public string UsuaPassword { get; set; } = null!;

    public bool? UsuaActivo { get; set; }

    public virtual ICollection<PerfilesUsuario> PerfilesUsuarios { get; } = new List<PerfilesUsuario>();

    public virtual ICollection<UsuariosAlimentadore> UsuariosAlimentadores { get; } = new List<UsuariosAlimentadore>();
}
