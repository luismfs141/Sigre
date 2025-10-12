using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class DeficienciasSeal
{
    public string? CodEmp { get; set; }

    public string? CodDef { get; set; }

    public double? TipIns { get; set; }

    public string? CodIns { get; set; }

    public string? TipDef { get; set; }

    public string? CodRes { get; set; }

    public string? NroSum { get; set; }

    public double? CodDen { get; set; }

    public string? FecDen { get; set; }

    public string? FecIns { get; set; }

    public string? FecSub { get; set; }

    public double? EstSub { get; set; }

    public string? Observ { get; set; }

    public string? Refer1 { get; set; }

    public string? Refer2 { get; set; }

    public double? CoordX { get; set; }

    public double? CoordY { get; set; }

    public string? CodAmt { get; set; }

    public string? UsuCre { get; set; }

    public string? UsuNpc { get; set; }

    public DateTime? FecReg { get; set; }

    public string? NroOrd { get; set; }
}
