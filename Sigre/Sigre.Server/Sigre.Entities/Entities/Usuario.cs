using System;
using System.Collections.Generic;

namespace Sigre.Entities;
    
public partial class Usuario
{
    public int UsuaInterno { get; set; }
    public string? UsuaNombres { get; set; }
    public string? UsuaApellidos { get; set; }
    public string? UsuaImei { get; set; }
    public int? AlimInterno { get; set; }
    public string? UsuaTipo { get; set; }
    public string? UsuaEquipo { get; set; }
    public bool UsuaActivo { get; set; }
    public virtual Alimentadore? AlimInternoNavigation { get; set; }
}