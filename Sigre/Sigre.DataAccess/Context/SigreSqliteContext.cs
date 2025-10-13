using Microsoft.EntityFrameworkCore;
using Sigre.Entities.Entities;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess.Context
{
    public class SigreSqliteContext : DbContext
    {
        public SigreSqliteContext(DbContextOptions<SigreSqliteContext> options)
            : base(options)
        {
        }

        public DbSet<Deficiencia> Deficiencias { get; set; }
        public DbSet<Archivo> Archivos { get; set; }
        public DbSet<Vano> Vanos { get; set; }
        public DbSet<Poste> Postes { get; set; }
        public DbSet<Sed> Seds { get; set; }
        public DbSet<Equipo> Switches { get; set; }
        public DbSet<TypificationStruct> Tipificaciones { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Perfile> Perfiles { get; set; }
        public DbSet<ArmadoMaterial> ArmadoMaterials { get; set; }
        public DbSet<ArmadoTipo> ArmadoTipos { get; set; }
        public DbSet<RetenidaTipo> RetenidaTipos { get; set; }
        public DbSet<RetenidaMaterial> RetenidaMaterials { get; set; }
        public DbSet<PosteMaterial> PosteMaterials { get; set; }
        public DbSet<SedMaterial> SedMaterials { get; set; }
        // 👇 nueva tabla de pines
        public DbSet<PinStruct> Pines { get; set; }
    }
}
