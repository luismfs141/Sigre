using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities;

public partial class Deficiencia
{
    [NotMapped]
    public int DefiEstadoOffLine { get; set; }
}
