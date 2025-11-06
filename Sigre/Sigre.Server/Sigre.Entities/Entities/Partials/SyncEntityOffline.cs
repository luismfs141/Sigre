using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities;

public partial class Deficiencia
{
    [NotMapped]
    public int? EstadoOffLine { get; set; } = null;
}

public partial class Archivo
{
    [NotMapped]
    public int? EstadoOffLine { get; set; } = null;
}

public partial class Poste
{
    [NotMapped]
    public int? EstadoOffLine { get; set; } = null;
}

public partial class Vano
{
    [NotMapped]
    public int? EstadoOffLine { get; set; } = null;
}

public partial class Sed
{
    [NotMapped]
    public int? EstadoOffLine { get; set; } = null;
}
