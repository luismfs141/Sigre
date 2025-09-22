using System;
using System.Collections.Generic;

namespace Sigre.DataAccess.Entities;

public partial class Equipo
{
    public int EquiInterno { get; set; }

    public string EquiEtiqueta { get; set; } = null!;

    public double EquiLatitud { get; set; }

    public double EquiLongitud { get; set; }

    public int AlimInterno { get; set; }

    public virtual Alimentadore AlimInternoNavigation { get; set; } = null!;
}
