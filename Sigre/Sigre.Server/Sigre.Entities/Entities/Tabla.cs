using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;


namespace Sigre.Entities.Entities;

public partial class Tabla
{
    [Key]
    public int TablInterno { get; set; }

    public string TablNombre { get; set; } = null!;

    public virtual ICollection<Componente> Componentes { get; } = new List<Componente>();
}
