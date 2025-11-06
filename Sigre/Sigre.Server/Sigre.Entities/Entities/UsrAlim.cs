using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;


namespace Sigre.Entities.Entities;

public partial class UsrAlim
{
    [Key]
    public int UsraInterno { get; set; }

    public int? UsuaInterno { get; set; }

    public int? AlimInterno { get; set; }

    public bool UsraActivo { get; set; }
}
