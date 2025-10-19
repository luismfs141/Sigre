using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Inspeccione
{
    [Key]
    public int InspInterno { get; set; }

    public string InspTipo { get; set; } = null!;

    public string InspCodigoElemento { get; set; } = null!;

    public DateTime InspFecha { get; set; }

    public virtual ICollection<Deficiencia> Deficiencia { get; } = new List<Deficiencia>();
}
