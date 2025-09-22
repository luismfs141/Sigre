using System;
using System.Collections.Generic;

namespace Sigre.Entities;
    
public partial class UsrDef
{
    public int UsrdInterno { get; set; }
    public int UsuaInterno { get; set; }
    public int DefiInterno { get; set; }
    public string UsrdOperacion { get; set; }
    public System.DateTime UsrdFechaRegistro { get; set; }
    public System.DateTime UsrdFechaOperacion { get; set; }
}

