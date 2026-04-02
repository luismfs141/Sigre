using Microsoft.EntityFrameworkCore;
using Sigre.Entities.Entities;
using Sigre.Entities.Structs;
using System;

namespace Sigre.DataAccess.Context
{
    public class SigreSqliteContext : DbContext
    {
        public SigreSqliteContext(DbContextOptions<SigreSqliteContext> options)
            : base(options) { }

        public DbSet<Deficiencia> Deficiencias { get; set; }
        public DbSet<Vano> Vanos { get; set; }
        public DbSet<Poste> Postes { get; set; }
        public DbSet<Sed> Seds { get; set; }
        public DbSet<Equipo> Switches { get; set; }
        public DbSet<TypificationStruct> Tipificaciones { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Perfile> Perfiles { get; set; }
        public DbSet<PerfilesUsuario> PerfilesUsuarios { get; set; }
        public DbSet<Archivo> Archivos { get; set; }
        public DbSet<ArmadoMaterial> ArmadoMaterials { get; set; }
        public DbSet<ArmadoTipo> ArmadoTipos { get; set; }
        public DbSet<RetenidaTipo> RetenidaTipos { get; set; }
        public DbSet<RetenidaMaterial> RetenidaMaterials { get; set; }
        public DbSet<PosteMaterial> PosteMaterials { get; set; }
        public DbSet<SedMaterial> SedMaterials { get; set; }
        public DbSet<PinStruct> Pines { get; set; }
        public DbSet<Alimentadore> Alimentadores { get; set; }
        public DbSet<Codigo> Codigos { get; set; }
        public DbSet<CodigosOpcione> CodigosOpciones { get; set; }
        public DbSet<EstadosGlobal> EstadosGlobals { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.EnableSensitiveDataLogging();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PinStruct>().Property(p => p.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<PinStruct>().Property(p => p.IdOriginal).HasDefaultValue(0);

            modelBuilder.Entity<Deficiencia>(entity =>
            {
                entity.HasKey(d => d.DefiInterno);
                entity.Property(d => d.DefiInterno).ValueGeneratedOnAdd();
                entity.Property<int?>("EstadoOffLine");
                entity.Property<int?>("DefiServerId");
            });

            modelBuilder.Entity<Archivo>(entity =>
            {
                entity.Property<int?>("EstadoOffLine");
                entity.Property<int?>("DefiServerId");
                entity.Property<string?>("DefiUuid");
            });

            modelBuilder.Entity<Poste>().Property<int?>("EstadoOffLine");
            modelBuilder.Entity<Vano>().Property<int?>("EstadoOffLine");
            modelBuilder.Entity<Sed>().Property<int?>("EstadoOffLine");

            modelBuilder.Entity<Codigo>(entity =>
            {
                entity.HasKey(e => e.CodiInterno);
                entity.Property(e => e.CodiInterno).ValueGeneratedNever();
            });

            modelBuilder.Entity<CodigosOpcione>(entity =>
            {
                entity.HasKey(e => e.CodopInterno);
                entity.Property(e => e.CodopInterno).ValueGeneratedNever();
            });

            modelBuilder.Entity<EstadosGlobal>(entity =>
            {
                entity.HasKey(e => e.EsgoInterno);
                entity.Property(e => e.EsgoInterno).ValueGeneratedNever();
            });
        }
    }
}