using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class CodigosOpciones
{
    [Key]
    public int CodopInterno { get; set; }

    public int CodiInterno { get; set; }

    public string CodopOpcion { get; set; } = null!;

    public string? CodopCol1 { get; set; }

    public string? CodopCol2 { get; set; }

    public virtual Codigo CodiInternoNavigation { get; set; } = null!;
}