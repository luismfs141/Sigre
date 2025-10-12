using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Sigre.Entities;
using Sigre.Entities.Entities.Structs;

namespace Sigre.DataAccess.Context;

public partial class SigreContext : DbContext
{
    public SigreContext()
    {
    }

    public SigreContext(DbContextOptions<SigreContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Alimentadore> Alimentadores { get; set; }

    public virtual DbSet<Archivo> Archivos { get; set; }

    public virtual DbSet<Codigo> Codigos { get; set; }

    public virtual DbSet<Componente> Componentes { get; set; }

    public virtual DbSet<Deficiencia> Deficiencias { get; set; }

    public virtual DbSet<DeficienciasSeal> DeficienciasSeals { get; set; }

    public virtual DbSet<Equipo> Equipos { get; set; }

    public virtual DbSet<Inspeccione> Inspecciones { get; set; }

    public virtual DbSet<KeyWord> KeyWords { get; set; }

    public virtual DbSet<Movile> Moviles { get; set; }

    public virtual DbSet<Ordene> Ordenes { get; set; }

    public virtual DbSet<Perfile> Perfiles { get; set; }

    public virtual DbSet<PerfilesCodigo> PerfilesCodigos { get; set; }

    public virtual DbSet<PerfilesUsuario> PerfilesUsuarios { get; set; }

    public virtual DbSet<Permiso> Permisos { get; set; }

    public virtual DbSet<PermisosPerfile> PermisosPerfiles { get; set; }

    public virtual DbSet<Poste> Postes { get; set; }

    public virtual DbSet<Sed> Seds { get; set; }

    public virtual DbSet<Tabla> Tablas { get; set; }

    public virtual DbSet<Tipificacione> Tipificaciones { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<UsuariosAlimentadore> UsuariosAlimentadores { get; set; }

    public virtual DbSet<Vano> Vanos { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=localhost;Database=sigre;User Id=sa;Password=1342;TrustServerCertificate=True;Encrypt=False;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alimentadore>(entity =>
        {
            entity.HasKey(e => e.AlimInterno).HasName("PK__Alimenta__A914B65AA77AF4C0");

            entity.Property(e => e.AlimInterno).HasColumnName("ALIM_Interno");
            entity.Property(e => e.AlimCodigo)
                .HasMaxLength(6)
                .IsUnicode(false)
                .HasColumnName("ALIM_Codigo");
            entity.Property(e => e.AlimEtiqueta)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("ALIM_Etiqueta");
            entity.Property(e => e.AlimLatitud).HasColumnName("ALIM_Latitud");
            entity.Property(e => e.AlimLongitud).HasColumnName("ALIM_Longitud");
        });

        modelBuilder.Entity<Archivo>(entity =>
        {
            entity.HasKey(e => e.ArchInterno).HasName("PK__Archivos__8119271AFE432850");

            entity.Property(e => e.ArchInterno).HasColumnName("ARCH_Interno");
            entity.Property(e => e.ArchActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("ARCH_Activo");
            entity.Property(e => e.ArchCodTabla).HasColumnName("ARCH_CodTabla");
            entity.Property(e => e.ArchNombre)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("ARCH_Nombre");
            entity.Property(e => e.ArchTabla)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("ARCH_Tabla");
            entity.Property(e => e.ArchTipo)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("ARCH_Tipo");
        });

        modelBuilder.Entity<Codigo>(entity =>
        {
            entity.HasKey(e => e.CodiInterno).HasName("PK__Codigos__23087E738F238967");

            entity.Property(e => e.CodiInterno).HasColumnName("CODI_Interno");
            entity.Property(e => e.CodiCodigo)
                .HasMaxLength(6)
                .IsUnicode(false)
                .HasColumnName("CODI_Codigo");
            entity.Property(e => e.CodiDeficiencia)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("CODI_Deficiencia");
            entity.Property(e => e.CompInterno).HasColumnName("COMP_Interno");

            entity.HasOne(d => d.CompInternoNavigation).WithMany(p => p.Codigos)
                .HasForeignKey(d => d.CompInterno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_CODI_COMP");
        });

        modelBuilder.Entity<Componente>(entity =>
        {
            entity.HasKey(e => e.CompInterno).HasName("PK__Componen__5CC4ECD0D14E0A39");

            entity.Property(e => e.CompInterno).HasColumnName("COMP_Interno");
            entity.Property(e => e.CompComponente)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("COMP_Componente");
            entity.Property(e => e.TablInterno).HasColumnName("TABL_Interno");

            entity.HasOne(d => d.TablInternoNavigation).WithMany(p => p.Componentes)
                .HasForeignKey(d => d.TablInterno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_COMP_TABL");
        });

        modelBuilder.Entity<Deficiencia>(entity =>
        {
            entity.HasKey(e => e.DefiInterno).HasName("PK__Deficien__CCD4DCC0294C4C3D");

            entity.Property(e => e.DefiInterno).HasColumnName("DEFI_Interno");
            entity.Property(e => e.DefiActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("DEFI_Activo");
            entity.Property(e => e.DefiArmadoMaterial)
                .HasMaxLength(2)
                .IsUnicode(false)
                .HasColumnName("DEFI_ArmadoMaterial");
            entity.Property(e => e.DefiCodAmt)
                .HasMaxLength(5)
                .IsUnicode(false)
                .HasColumnName("DEFI_CodAMT");
            entity.Property(e => e.DefiCodDef)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DEFI_CodDef");
            entity.Property(e => e.DefiCodDen).HasColumnName("DEFI_CodDen");
            entity.Property(e => e.DefiCodRes).HasColumnName("DEFI_CodRes");
            entity.Property(e => e.DefiCodigoElemento)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("DEFI_CodigoElemento");
            entity.Property(e => e.DefiCol1)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("DEFI_Col1");
            entity.Property(e => e.DefiCol2)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("DEFI_Col2");
            entity.Property(e => e.DefiCol3)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("DEFI_Col3");
            entity.Property(e => e.DefiComentario)
                .HasMaxLength(120)
                .IsUnicode(false)
                .HasColumnName("DEFI_Comentario");
            entity.Property(e => e.DefiCoordX).HasColumnName("DEFI_CoordX");
            entity.Property(e => e.DefiCoordY).HasColumnName("DEFI_CoordY");
            entity.Property(e => e.DefiDistHorizontal)
                .HasColumnType("numeric(10, 2)")
                .HasColumnName("DEFI_DistHorizontal");
            entity.Property(e => e.DefiDistTransversal)
                .HasColumnType("numeric(10, 2)")
                .HasColumnName("DEFI_DistTransversal");
            entity.Property(e => e.DefiDistVertical)
                .HasColumnType("numeric(10, 2)")
                .HasColumnName("DEFI_DistVertical");
            entity.Property(e => e.DefiEstado)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DEFI_Estado");
            entity.Property(e => e.DefiEstadoCriticidad).HasColumnName("DEFI_EstadoCriticidad");
            entity.Property(e => e.DefiEstadoSubsanacion)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DEFI_EstadoSubsanacion");
            entity.Property(e => e.DefiFecModificacion)
                .HasColumnType("datetime")
                .HasColumnName("DEFI_FecModificacion");
            entity.Property(e => e.DefiFecRegistro)
                .HasColumnType("datetime")
                .HasColumnName("DEFI_FecRegistro");
            entity.Property(e => e.DefiFechaCreacion)
                .HasColumnType("datetime")
                .HasColumnName("DEFI_FechaCreacion");
            entity.Property(e => e.DefiFechaDenuncia)
                .HasColumnType("datetime")
                .HasColumnName("DEFI_FechaDenuncia");
            entity.Property(e => e.DefiFechaInspeccion)
                .HasColumnType("datetime")
                .HasColumnName("DEFI_FechaInspeccion");
            entity.Property(e => e.DefiFechaSubsanacion)
                .HasColumnType("datetime")
                .HasColumnName("DEFI_FechaSubsanacion");
            entity.Property(e => e.DefiIdElemento).HasColumnName("DEFI_IdElemento");
            entity.Property(e => e.DefiInspeccionado).HasColumnName("DEFI_Inspeccionado");
            entity.Property(e => e.DefiKeyWords)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("DEFI_KeyWords");
            entity.Property(e => e.DefiLatitud).HasColumnName("DEFI_Latitud");
            entity.Property(e => e.DefiLongitud).HasColumnName("DEFI_Longitud");
            entity.Property(e => e.DefiNodoFinal)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DEFI_NodoFinal");
            entity.Property(e => e.DefiNodoInicial)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DEFI_NodoInicial");
            entity.Property(e => e.DefiNroOrden)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("DEFI_NroOrden");
            entity.Property(e => e.DefiNumPostes).HasColumnName("DEFI_NumPostes");
            entity.Property(e => e.DefiNumSuministro)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DEFI_NumSuministro");
            entity.Property(e => e.DefiObservacion)
                .IsUnicode(false)
                .HasColumnName("DEFI_Observacion");
            entity.Property(e => e.DefiPointX).HasColumnName("DEFI_PointX");
            entity.Property(e => e.DefiPointY).HasColumnName("DEFI_PointY");
            entity.Property(e => e.DefiPozoTierra)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DEFI_PozoTierra");
            entity.Property(e => e.DefiPozoTierra2)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DEFI_PozoTierra2");
            entity.Property(e => e.DefiRefer1)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("DEFI_Refer1");
            entity.Property(e => e.DefiRefer2)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("DEFI_Refer2");
            entity.Property(e => e.DefiResponsable)
                .HasDefaultValueSql("((0))")
                .HasColumnName("DEFI_Responsable");
            entity.Property(e => e.DefiRetenidaMaterial)
                .HasMaxLength(2)
                .IsUnicode(false)
                .HasColumnName("DEFI_RetenidaMaterial");
            entity.Property(e => e.DefiTipoArmado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DEFI_TipoArmado");
            entity.Property(e => e.DefiTipoElemento)
                .HasMaxLength(4)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DEFI_TipoElemento");
            entity.Property(e => e.DefiTipoMaterial)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasColumnName("DEFI_TipoMaterial");
            entity.Property(e => e.DefiTipoRetenida)
                .HasMaxLength(2)
                .IsUnicode(false)
                .HasColumnName("DEFI_TipoRetenida");
            entity.Property(e => e.DefiUsuCre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("DEFI_UsuCre");
            entity.Property(e => e.DefiUsuNpc)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("DEFI_UsuNPC");
            entity.Property(e => e.DefiUsuarioInic)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValueSql("('')")
                .HasColumnName("DEFI_UsuarioInic");
            entity.Property(e => e.DefiUsuarioMod)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValueSql("('')")
                .HasColumnName("DEFI_UsuarioMod");
            entity.Property(e => e.InspInterno).HasColumnName("INSP_Interno");
            entity.Property(e => e.TablInterno).HasColumnName("TABL_Interno");
            entity.Property(e => e.TipiInterno).HasColumnName("TIPI_Interno");

            entity.HasOne(d => d.InspInternoNavigation).WithMany(p => p.Deficiencia)
                .HasForeignKey(d => d.InspInterno)
                .HasConstraintName("fk_DEFI_INSP");
        });

        modelBuilder.Entity<DeficienciasSeal>(entity =>
        {
            entity
                .HasNoKey()
                .ToTable("DeficienciasSeal");

            entity.Property(e => e.CodAmt)
                .HasMaxLength(255)
                .HasColumnName("CodAMT");
            entity.Property(e => e.CodDef)
                .HasMaxLength(255)
                .HasColumnName("CodDEF");
            entity.Property(e => e.CodDen).HasColumnName("CodDEN");
            entity.Property(e => e.CodEmp).HasMaxLength(255);
            entity.Property(e => e.CodIns)
                .HasMaxLength(255)
                .HasColumnName("CodINS");
            entity.Property(e => e.CodRes)
                .HasMaxLength(255)
                .HasColumnName("CodRES");
            entity.Property(e => e.EstSub).HasColumnName("EstSUB");
            entity.Property(e => e.FecDen)
                .HasMaxLength(255)
                .HasColumnName("FecDEN");
            entity.Property(e => e.FecIns)
                .HasMaxLength(255)
                .HasColumnName("FecINS");
            entity.Property(e => e.FecReg).HasColumnType("datetime");
            entity.Property(e => e.FecSub)
                .HasMaxLength(255)
                .HasColumnName("FecSUB");
            entity.Property(e => e.NroOrd)
                .HasMaxLength(255)
                .HasColumnName("NroORD");
            entity.Property(e => e.NroSum)
                .HasMaxLength(255)
                .HasColumnName("NroSUM");
            entity.Property(e => e.Observ).HasMaxLength(255);
            entity.Property(e => e.Refer1).HasMaxLength(255);
            entity.Property(e => e.Refer2).HasMaxLength(255);
            entity.Property(e => e.TipDef)
                .HasMaxLength(255)
                .HasColumnName("TipDEF");
            entity.Property(e => e.TipIns).HasColumnName("TipINS");
            entity.Property(e => e.UsuCre).HasMaxLength(255);
            entity.Property(e => e.UsuNpc)
                .HasMaxLength(255)
                .HasColumnName("UsuNPc");
        });

        modelBuilder.Entity<Equipo>(entity =>
        {
            entity.HasKey(e => e.EquiInterno).HasName("PK__Equipos__F076A0C9E703944E");

            entity.Property(e => e.EquiInterno).HasColumnName("EQUI_Interno");
            entity.Property(e => e.AlimInterno).HasColumnName("ALIM_interno");
            entity.Property(e => e.EquiEtiqueta)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("EQUI_Etiqueta");
            entity.Property(e => e.EquiLatitud).HasColumnName("EQUI_Latitud");
            entity.Property(e => e.EquiLongitud).HasColumnName("EQUI_Longitud");

            entity.HasOne(d => d.AlimInternoNavigation).WithMany(p => p.Equipos)
                .HasForeignKey(d => d.AlimInterno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_EQUI_ALIM");
        });

        modelBuilder.Entity<Inspeccione>(entity =>
        {
            entity.HasKey(e => e.InspInterno).HasName("PK__Inspecci__0E84CC597BA2C045");

            entity.Property(e => e.InspInterno).HasColumnName("INSP_Interno");
            entity.Property(e => e.InspCodigoElemento)
                .HasMaxLength(40)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("INSP_CodigoElemento");
            entity.Property(e => e.InspFecha)
                .HasColumnType("datetime")
                .HasColumnName("INSP_Fecha");
            entity.Property(e => e.InspTipo)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("INSP_Tipo");
        });

        modelBuilder.Entity<KeyWord>(entity =>
        {
            entity.HasKey(e => e.KeywInterno).HasName("PK__KeyWords__14F70153A7AA82AF");

            entity.Property(e => e.KeywInterno).HasColumnName("KEYW_Interno");
            entity.Property(e => e.KeywPalClave)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("KEYW_PalClave");
            entity.Property(e => e.TipiInterno).HasColumnName("TIPI_Interno");

            entity.HasOne(d => d.TipiInternoNavigation).WithMany(p => p.KeyWords)
                .HasForeignKey(d => d.TipiInterno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("KEYW_TIPI_FK");
        });

        modelBuilder.Entity<Movile>(entity =>
        {
            entity.HasKey(e => e.MoviInterno);

            entity.Property(e => e.MoviInterno).HasColumnName("MOVI_Interno");
            entity.Property(e => e.MoviActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("MOVI_Activo");
            entity.Property(e => e.MoviCorporativo).HasColumnName("MOVI_Corporativo");
            entity.Property(e => e.MoviDescripcion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("MOVI_Descripcion");
            entity.Property(e => e.MoviImei)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("MOVI_Imei");
            entity.Property(e => e.MoviMarca)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("MOVI_Marca");
            entity.Property(e => e.MoviModelo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("MOVI_Modelo");
            entity.Property(e => e.MoviNombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("MOVI_Nombre");
        });

        modelBuilder.Entity<Ordene>(entity =>
        {
            entity.HasKey(e => e.OrdeInterno).HasName("PK__Ordenes__DD34E2BC2C36966C");

            entity.Property(e => e.OrdeInterno).HasColumnName("ORDE_Interno");
            entity.Property(e => e.OrdeCodAmt).HasColumnName("ORDE_CodAMT");
            entity.Property(e => e.OrdeCodigo)
                .HasMaxLength(9)
                .HasColumnName("ORDE_Codigo");
            entity.Property(e => e.OrdeFechaOrd)
                .HasColumnType("datetime")
                .HasColumnName("ORDE_FechaOrd");
        });

        modelBuilder.Entity<Perfile>(entity =>
        {
            entity.HasKey(e => e.PerfInterno);

            entity.Property(e => e.PerfInterno).HasColumnName("PERF_Interno");
            entity.Property(e => e.PerfActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("PERF_Activo");
            entity.Property(e => e.PerfNombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("PERF_Nombre");
        });

        modelBuilder.Entity<PerfilesCodigo>(entity =>
        {
            entity.HasKey(e => e.PfcdInterno);

            entity.Property(e => e.PfcdInterno).HasColumnName("PFCD_Interno");
            entity.Property(e => e.PfcdActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("PFCD_Activo");
            entity.Property(e => e.PfcdCodigo).HasColumnName("PFCD_Codigo");
            entity.Property(e => e.PfcdPerfil).HasColumnName("PFCD_Perfil");

            entity.HasOne(d => d.PfcdCodigoNavigation).WithMany(p => p.PerfilesCodigos)
                .HasForeignKey(d => d.PfcdCodigo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PerfilesCodigos_Codigos");

            entity.HasOne(d => d.PfcdPerfilNavigation).WithMany(p => p.PerfilesCodigos)
                .HasForeignKey(d => d.PfcdPerfil)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PerfilesCodigos_Perfiles");
        });

        modelBuilder.Entity<PerfilesUsuario>(entity =>
        {
            entity.HasKey(e => e.PfusInterno);

            entity.Property(e => e.PfusInterno)
                .ValueGeneratedNever()
                .HasColumnName("PFUS_Interno");
            entity.Property(e => e.PfusActivo).HasColumnName("PFUS_Activo");
            entity.Property(e => e.PfusPerfil).HasColumnName("PFUS_Perfil");
            entity.Property(e => e.PfusUsuario).HasColumnName("PFUS_Usuario");

            entity.HasOne(d => d.PfusPerfilNavigation).WithMany(p => p.PerfilesUsuarios)
                .HasForeignKey(d => d.PfusPerfil)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PerfilesUsuarios_Perfiles");

            entity.HasOne(d => d.PfusUsuarioNavigation).WithMany(p => p.PerfilesUsuarios)
                .HasForeignKey(d => d.PfusUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PerfilUsuario_Usuario");
        });

        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.HasKey(e => e.PermInterno);

            entity.Property(e => e.PermInterno).HasColumnName("PERM_Interno");
            entity.Property(e => e.PermActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("PERM_Activo");
            entity.Property(e => e.PermNombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("PERM_Nombre");
            entity.Property(e => e.PermReferencia)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("PERM_Referencia");
        });

        modelBuilder.Entity<PermisosPerfile>(entity =>
        {
            entity.HasKey(e => e.PmpfInterno);

            entity.Property(e => e.PmpfInterno).HasColumnName("PMPF_Interno");
            entity.Property(e => e.PmpfActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("PMPF_Activo");
            entity.Property(e => e.PmpfPerfil).HasColumnName("PMPF_Perfil");
            entity.Property(e => e.PmpfPermiso).HasColumnName("PMPF_Permiso");

            entity.HasOne(d => d.PmpfPerfilNavigation).WithMany(p => p.PermisosPerfiles)
                .HasForeignKey(d => d.PmpfPerfil)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PermisosPerfiles_Perfiles");

            entity.HasOne(d => d.PmpfPermisoNavigation).WithMany(p => p.PermisosPerfiles)
                .HasForeignKey(d => d.PmpfPermiso)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PermisosPerfiles_Permisos");
        });

        modelBuilder.Entity<Poste>(entity =>
        {
            entity.HasKey(e => e.PostInterno).HasName("PK__Postes__32D6373064A8395B");

            entity.Property(e => e.PostInterno).HasColumnName("POST_Interno");
            entity.Property(e => e.AlimInterno).HasColumnName("ALIM_Interno");
            entity.Property(e => e.PostCodigoNodo)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("POST_CodigoNodo");
            entity.Property(e => e.PostEtiqueta)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("POST_Etiqueta");
            entity.Property(e => e.PostInspeccionado).HasColumnName("POST_Inspeccionado");
            entity.Property(e => e.PostLatitud).HasColumnName("POST_Latitud");
            entity.Property(e => e.PostLongitud).HasColumnName("POST_Longitud");
            entity.Property(e => e.PostMaterial)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasColumnName("POST_Material");
            entity.Property(e => e.PostTerceros).HasColumnName("POST_Terceros");
        });

        modelBuilder.Entity<Sed>(entity =>
        {
            entity.HasKey(e => e.SedInterno).HasName("PK__Seds__8663923FFA8E57F0");

            entity.Property(e => e.SedInterno).HasColumnName("SED_Interno");
            entity.Property(e => e.AlimInterno).HasColumnName("ALIM_Interno");
            entity.Property(e => e.SedCodigo)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("SED_Codigo");
            entity.Property(e => e.SedEtiqueta)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("SED_Etiqueta");
            entity.Property(e => e.SedInspeccionado).HasColumnName("SED_Inspeccionado");
            entity.Property(e => e.SedLatitud).HasColumnName("SED_Latitud");
            entity.Property(e => e.SedLongitud).HasColumnName("SED_Longitud");
            entity.Property(e => e.SedMaterial)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasColumnName("SED_Material");
            entity.Property(e => e.SedSimbolo)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("SED_Simbolo");
            entity.Property(e => e.SedTerceros).HasColumnName("SED_Terceros");
            entity.Property(e => e.SedTipo)
                .HasMaxLength(1)
                .IsUnicode(false)
                .HasDefaultValueSql("('M')")
                .IsFixedLength()
                .HasColumnName("SED_Tipo");
        });

        modelBuilder.Entity<Tabla>(entity =>
        {
            entity.HasKey(e => e.TablInterno).HasName("PK__Tablas__81723721D3D93E07");

            entity.Property(e => e.TablInterno).HasColumnName("TABL_Interno");
            entity.Property(e => e.TablNombre)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("TABL_Nombre");
        });

        modelBuilder.Entity<Tipificacione>(entity =>
        {
            entity.HasKey(e => e.TipiInterno).HasName("PK__Tipifica__A60961BB994EE79F");

            entity.Property(e => e.TipiInterno).HasColumnName("TIPI_Interno");
            entity.Property(e => e.CodiInterno).HasColumnName("CODI_Interno");
            entity.Property(e => e.TipoDescripcion)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("TIPO_Descripcion");

            entity.HasOne(d => d.CodiInternoNavigation).WithMany(p => p.Tipificaciones)
                .HasForeignKey(d => d.CodiInterno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_TIPI_CODI");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.UsuaInterno).HasName("PK__Usuarios__D34094097AE6F930");

            entity.Property(e => e.UsuaInterno).HasColumnName("USUA_Interno");
            entity.Property(e => e.UsuaActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("USUA_Activo");
            entity.Property(e => e.UsuaApellidos)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("USUA_Apellidos");
            entity.Property(e => e.UsuaCorreo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("USUA_Correo");
            entity.Property(e => e.UsuaNombres)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("USUA_Nombres");
            entity.Property(e => e.UsuaPassword)
                .IsUnicode(false)
                .HasColumnName("USUA_Password");
        });

        modelBuilder.Entity<UsuariosAlimentadore>(entity =>
        {
            entity.HasKey(e => e.UsalInterno).HasName("PK_UsuarioAlimentador");

            entity.Property(e => e.UsalInterno).HasColumnName("USAL_Interno");
            entity.Property(e => e.UsalActivo)
                .IsRequired()
                .HasDefaultValueSql("((1))")
                .HasColumnName("USAL_Activo");
            entity.Property(e => e.UsalAlimentador).HasColumnName("USAL_Alimentador");
            entity.Property(e => e.UsalUsuario).HasColumnName("USAL_Usuario");

            entity.HasOne(d => d.UsalAlimentadorNavigation).WithMany(p => p.UsuariosAlimentadores)
                .HasForeignKey(d => d.UsalAlimentador)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioAlimentador_Alimentador");

            entity.HasOne(d => d.UsalUsuarioNavigation).WithMany(p => p.UsuariosAlimentadores)
                .HasForeignKey(d => d.UsalUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioAlimentador_Usuario");
        });

        modelBuilder.Entity<Vano>(entity =>
        {
            entity.HasKey(e => e.VanoInterno).HasName("PK__Vanos__535F26F4097793A8");

            entity.Property(e => e.VanoInterno).HasColumnName("VANO_Interno");
            entity.Property(e => e.AlimInterno).HasColumnName("ALIM_Interno");
            entity.Property(e => e.VanoCodigo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("VANO_Codigo");
            entity.Property(e => e.VanoEtiqueta)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("VANO_Etiqueta");
            entity.Property(e => e.VanoInspeccionado).HasColumnName("VANO_Inspeccionado");
            entity.Property(e => e.VanoLatitudFin).HasColumnName("VANO_LatitudFin");
            entity.Property(e => e.VanoLatitudIni).HasColumnName("VANO_LatitudIni");
            entity.Property(e => e.VanoLongitudFin).HasColumnName("VANO_LongitudFin");
            entity.Property(e => e.VanoLongitudIni).HasColumnName("VANO_LongitudIni");
            entity.Property(e => e.VanoMaterial)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasColumnName("VANO_Material");
            entity.Property(e => e.VanoNodoFinal)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("VANO_NodoFinal");
            entity.Property(e => e.VanoNodoInicial)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("VANO_NodoInicial");
            entity.Property(e => e.VanoTerceros).HasColumnName("VANO_Terceros");

            entity.HasOne(d => d.AlimInternoNavigation).WithMany(p => p.Vanos)
                .HasForeignKey(d => d.AlimInterno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_VANO_ALIM");
        });

        modelBuilder.Entity<DeficiencyDto>().HasNoKey().ToView(null);

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
