using System;
using System.Collections.Generic;

namespace Sigre.DataAccess.Entities;

public partial class UsrDef
{
    public int UsrdInterno { get; set; }

    public int UsuaInterno { get; set; }

    public int DefiInterno { get; set; }

    public string UsrdOperacion { get; set; } = null!;

    public DateTime UsrdFechaRegistro { get; set; }

    public DateTime UsrdFechaOperacion { get; set; }
}
