using Microsoft.EntityFrameworkCore;
using Sigre.Entities.Entities;
using Sigre.Entities.Structs;

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

            // =========================================================
            // IGNORAR SOLO LO QUE NO NECESITAS EXPORTAR COMO TABLA
            // =========================================================
            modelBuilder.Ignore<Inspeccione>();
            modelBuilder.Ignore<Tramo>();

            // =========================================================
            // ESTADOS GLOBAL
            // =========================================================
            modelBuilder.Entity<EstadosGlobal>(entity =>
            {
                entity.HasKey(e => e.EsgoInterno);
                entity.Property(e => e.EsgoInterno).ValueGeneratedNever();

                entity.Ignore(e => e.Archivos);
                entity.Ignore(e => e.Deficiencia);
                entity.Ignore(e => e.Postes);
                entity.Ignore(e => e.Seds);
                entity.Ignore(e => e.Vanos);
            });

            // =========================================================
            // PINES
            // =========================================================
            modelBuilder.Entity<PinStruct>(entity =>
            {
                entity.Property(p => p.Id).ValueGeneratedOnAdd();
                entity.Property(p => p.IdOriginal).HasDefaultValue(0);
            });

            // =========================================================
            // DEFICIENCIAS
            // =========================================================
            modelBuilder.Entity<Deficiencia>(entity =>
            {
                entity.HasKey(d => d.DefiInterno);
                entity.Property(d => d.DefiInterno).ValueGeneratedOnAdd();

                entity.Ignore(d => d.EsgoInternoNavigation);
                entity.Ignore(d => d.InspInternoNavigation);
                entity.Ignore(d => d.EsTercero);

                entity.Property<int?>("EstadoOffLine");
                entity.Property<int?>("DefiServerId");
            });

            // =========================================================
            // ARCHIVOS
            // =========================================================
            modelBuilder.Entity<Archivo>(entity =>
            {
                entity.HasKey(a => a.ArchInterno);
                entity.Property(a => a.ArchInterno).ValueGeneratedOnAdd();

                entity.Ignore(a => a.EsgoInternoNavigation);

                entity.Property<int?>("EstadoOffLine");
                entity.Property<int?>("DefiServerId");
                entity.Property<string?>("DefiUuid");
            });

            // =========================================================
            // POSTES
            // =========================================================
            modelBuilder.Entity<Poste>(entity =>
            {
                entity.HasKey(p => p.PostInterno);
                entity.Property(p => p.PostInterno).ValueGeneratedNever();

                entity.Ignore(p => p.EsgoInternoNavigation);
                entity.Ignore(p => p.PostArmadoMaterialNavigation);
                entity.Ignore(p => p.PostArmadoTipoNavigation);
                entity.Ignore(p => p.PostMaterialNavigation);
                entity.Ignore(p => p.PostRetenidaMaterialNavigation);
                entity.Ignore(p => p.PostRetenidaTipoNavigation);
                entity.Ignore(p => p.TramInternoNavigation);

                entity.Property<int?>("EstadoOffLine");
            });

            // =========================================================
            // VANOS
            // =========================================================
            modelBuilder.Entity<Vano>(entity =>
            {
                entity.HasKey(v => v.VanoInterno);
                entity.Property(v => v.VanoInterno).ValueGeneratedNever();

                entity.Ignore(v => v.AlimInternoNavigation);
                entity.Ignore(v => v.EsgoInternoNavigation);
                entity.Ignore(v => v.TramInternoNavigation);

                entity.Property<int?>("EstadoOffLine");
            });

            // =========================================================
            // SEDS
            // =========================================================
            modelBuilder.Entity<Sed>(entity =>
            {
                entity.HasKey(s => s.SedInterno);
                entity.Property(s => s.SedInterno).ValueGeneratedNever();

                entity.Ignore(s => s.EsgoInternoNavigation);
                entity.Ignore(s => s.InverseSedMaterialNavigation);
                entity.Ignore(s => s.SedArmadoMaterialNavigation);
                entity.Ignore(s => s.SedArmadoTipoNavigation);
                entity.Ignore(s => s.SedMaterialNavigation);
                entity.Ignore(s => s.SedRetenidaMaterialNavigation);
                entity.Ignore(s => s.SedRetenidaTipoNavigation);
                entity.Ignore(s => s.TramInternoNavigation);

                entity.Property<int?>("EstadoOffLine");
            });

            // =========================================================
            // CATÁLOGOS
            // =========================================================
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
        }
    }
}