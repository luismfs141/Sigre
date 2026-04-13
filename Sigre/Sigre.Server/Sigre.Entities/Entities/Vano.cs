using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;

namespace Sigre.Entities.Entities;

public partial class Vano
{
    [Key]
    public int VanoInterno { get; set; }

    public string? VanoCodigo { get; set; }

    public double VanoLatitudIni { get; set; }

    public double VanoLongitudIni { get; set; }

    public double VanoLatitudFin { get; set; }

    public double VanoLongitudFin { get; set; }

    public int AlimInterno { get; set; }

    public string VanoEtiqueta { get; set; } = null!;

    public bool VanoTerceros { get; set; }

    public string? VanoMaterial { get; set; }

    public string? VanoNodoInicial { get; set; }

    public string? VanoNodoFinal { get; set; }

    public bool VanoInspeccionado { get; set; }

    public int? VanoSubestacion { get; set; }

    public bool? VanoEsMt { get; set; }

    public bool? VanoEsBt { get; set; }

    public int? TramInterno { get; set; }

    public string? VanoTramo { get; set; }

    public int? EsgoInterno { get; set; }

    public virtual Alimentadore AlimInternoNavigation { get; set; } = null!;

    public virtual EstadosGlobal? EsgoInternoNavigation { get; set; }

    public virtual Tramo? TramInternoNavigation { get; set; }
}
public class VanoGuardarDTO
{
    // --- Identificadores y Relaciones (Solo los IDs) ---
    public int VanoInterno { get; set; }
    public int AlimInterno { get; set; }
    public int VanoSubestacion { get; set; }

    // --- Datos Generales ---
    public string VanoCodigo { get; set; }
    public string VanoEtiqueta { get; set; }
    public string? VanoMaterial { get; set; } // Permite nulos ya que en tu JSON viaja como "null"
    public string VanoNodoInicial { get; set; }
    public string VanoNodoFinal { get; set; }

    // --- Geometría (Coordenadas) ---
    // Usamos double (o decimal) para la precisión de las coordenadas
    public double VanoLatitudIni { get; set; }
    public double VanoLongitudIni { get; set; }
    public double VanoLatitudFin { get; set; }
    public double VanoLongitudFin { get; set; }

    // --- Banderas (Booleanos) ---
    public bool VanoEsBt { get; set; }
    public bool? VanoEsMt { get; set; } // Nullable según la lógica de tu caso "Nuevo"
    public bool VanoInspeccionado { get; set; }
    public bool VanoTerceros { get; set; }

    // --- Extras ---
    // El frontend envía esto en el JSON, lo capturamos por si lo necesitas
    public string? tipoElemento { get; set; }
}