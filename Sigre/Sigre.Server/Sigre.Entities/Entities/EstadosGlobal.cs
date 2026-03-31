using Sigre.Entities.Entities;
using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class EstadosGlobal
{
    public int EsgoInterno { get; set; }

    public string EsgoNombre { get; set; } = null!;

    public string? EsgoColor { get; set; }

    public string? EsgoDescripcion { get; set; }

    public string EsgoTabla { get; set; } = null!;

    public bool EsgoActivo { get; set; }

    public virtual ICollection<Archivo> Archivos { get; set; } = new List<Archivo>();

    public virtual ICollection<Deficiencia> Deficiencia { get; set; } = new List<Deficiencia>();

    public virtual ICollection<Poste> Postes { get; set; } = new List<Poste>();

    public virtual ICollection<Sed> Seds { get; set; } = new List<Sed>();

    public virtual ICollection<Vano> Vanos { get; set; } = new List<Vano>();
}
