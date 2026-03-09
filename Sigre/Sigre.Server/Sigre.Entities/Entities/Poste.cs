using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sigre.Entities.Entities;

public partial class Poste
{
    [Key]
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

    public int? PostSubestacion { get; set; }

    public bool? PostEsMt { get; set; }

    public bool? PostEsBt { get; set; }
    public decimal? PostAltura { get; set; }
    public string? PostTramo { get; set; }

    public bool PostVereda { get; set; }


    public virtual ArmadoMaterial? PostArmadoMaterialNavigation { get; set; }

    public virtual ArmadoTipo? PostArmadoTipoNavigation { get; set; }

    public virtual PosteMaterial? PostMaterialNavigation { get; set; }

    public virtual RetenidaMaterial? PostRetenidaMaterialNavigation { get; set; }

    public virtual RetenidaTipo? PostRetenidaTipoNavigation { get; set; }
}
// Puedes poner esto en un archivo llamado "PagedResult.cs" o al inicio de tu DAPost.cs
public class PagedResult<T>
{
    public int TotalRecords { get; set; }
    public List<T> Data { get; set; }
}