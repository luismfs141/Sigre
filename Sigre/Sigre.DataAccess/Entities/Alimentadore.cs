using System;
using System.Collections.Generic;

namespace Sigre.DataAccess.Entities;

public partial class Alimentadore
{
    public int AlimInterno { get; set; }

    public string AlimCodigo { get; set; } = null!;

    public double AlimLatitud { get; set; }

    public double AlimLongitud { get; set; }

    public string? AlimEtiqueta { get; set; }

    public virtual ICollection<Equipo> Equipos { get; } = new List<Equipo>();

    public virtual ICollection<Usuario> Usuarios { get; } = new List<Usuario>();

    public virtual ICollection<Vano> Vanos { get; } = new List<Vano>();
}
