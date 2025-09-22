using System;
using System.Collections.Generic;

namespace Sigre.Entities;
 
public partial class UsrAlim
{
    public int UsraInterno { get; set; }
    public int? UsuaInterno { get; set; }
    public bool UsraActivo { get; set; }
    public int? AlimInterno { get; set; }
}

