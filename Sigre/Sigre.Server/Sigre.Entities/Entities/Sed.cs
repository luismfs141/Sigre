using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Sed
{
    [Key]
    public int SedInterno { get; set; }

    public string SedEtiqueta { get; set; } = null!;

    public double SedLatitud { get; set; }

    public double SedLongitud { get; set; }

    public string SedTipo { get; set; } = null!;

    public int AlimInterno { get; set; }

    public string SedCodigo { get; set; } = null!;

    public string SedSimbolo { get; set; } = null!;

    public bool SedTerceros { get; set; }

    public int? SedMaterial { get; set; }

    public bool SedInspeccionado { get; set; }

    public int? SedNumPostes { get; set; }

    public int? SedArmadoTipo { get; set; }

    public int? SedArmadoMaterial { get; set; }

    public int? SedRetenidaTipo { get; set; }

    public int? SedRetenidaMaterial { get; set; }

    public virtual ICollection<Sed> InverseSedMaterialNavigation { get; } = new List<Sed>();

    public virtual ArmadoMaterial? SedArmadoMaterialNavigation { get; set; }

    public virtual ArmadoTipo? SedArmadoTipoNavigation { get; set; }

    public virtual Sed? SedMaterialNavigation { get; set; }

    public virtual RetenidaMaterial? SedRetenidaMaterialNavigation { get; set; }

    public virtual RetenidaTipo? SedRetenidaTipoNavigation { get; set; }
}
