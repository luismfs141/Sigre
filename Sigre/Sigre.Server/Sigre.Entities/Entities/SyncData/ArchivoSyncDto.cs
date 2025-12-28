using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.SyncData
{
    public class ArchivoSyncDto
    {
        // ===============================
        // 🔹 SQLite (PK local)
        // ===============================
        public int ArchInterno { get; set; }

        // ===============================
        // 🔹 Datos del archivo
        // ===============================
        public string ArchTipo { get; set; } = null!;
        public string ArchTabla { get; set; } = null!;
        public int ArchCodTabla { get; set; }
        public string ArchNombre { get; set; } = null!;

        public double? ArchLatitud { get; set; }
        public double? ArchLongitud { get; set; }

        // SQLite guarda fecha como TEXT
        public DateTime? ArchFecha { get; set; }

        public string? ArchTipoElemento { get; set; }
        public int? ArchIdElemento { get; set; }
        public int? TipiInterno { get; set; }

        // SQLite INTEGER → bool
        public int? ArchActivo { get; set; }

        // ===============================
        // 🔹 Control de sincronización
        // ===============================
        public int EstadoOffLine { get; set; }   // 1=Update | 2=Insert | 3=Delete
        public int? DefiServerId { get; set; }   // ID real en SQL Server
    }

}
