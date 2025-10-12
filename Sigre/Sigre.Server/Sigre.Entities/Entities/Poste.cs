using System;
using System.Collections.Generic;

namespace Sigre.Entities.Entities;

public partial class Poste
{
    public int PostInterno { get; set; }

    public string PostEtiqueta { get; set; } = null!;

    public double? PostLatitud { get; set; }

    public double? PostLongitud { get; set; }

    public int AlimInterno { get; set; }

    public string? PostCodigoNodo { get; set; }

    public bool PostTerceros { get; set; }

    public int? PostMaterial { get; set; }

    public bool PostInspeccionado { get; set; }

    public int? PostRetenidaTipo { get; set; }

    public int? PostRetenidaMaterial { get; set; }

    public int? PostArmadoTipo { get; set; }

    public int? PostArmadoMaterial { get; set; }

    public virtual ArmadoMaterial? PostArmadoMaterialNavigation { get; set; }

    public virtual ArmadoTipo? PostArmadoTipoNavigation { get; set; }

    public virtual PosteMaterial? PostMaterialNavigation { get; set; }

    public virtual RetenidaMaterial? PostRetenidaMaterialNavigation { get; set; }

    public virtual RetenidaTipo? PostRetenidaTipoNavigation { get; set; }
}
