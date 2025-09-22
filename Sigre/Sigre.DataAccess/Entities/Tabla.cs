using System;
using System.Collections.Generic;

namespace Sigre.DataAccess.Entities;

public partial class Tabla
{
    public int TablInterno { get; set; }

    public string TablNombre { get; set; } = null!;

    public virtual ICollection<Componente> Componentes { get; } = new List<Componente>();
}
