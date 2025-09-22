/******************************/
/************ POSTES **********/
/******************************/

CREATE Procedure [dbo].[sp_GetPostsByFeeder]
	@Feeder int
AS
Begin
select		CONVERT(int ,row_number() OVER(Order By p.POST_Interno)) StructId, a.ALIM_Codigo FeederCode, p.POST_Interno ElementId, 'POST' ElementType, p.POST_CodigoNodo CodIns, p.POST_Etiqueta Label, 
			isnull(d.CODI_Codigo,'') TypificationCode, '' SedType, '' StartNode, '' EndNode, isnull(f.Ruta,'') PhotosPath, isnull(f.Cantidad,0) PhotosQuantity
from		Postes			p
inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
left join	
(
			select	c.CODI_Codigo, d.DEFI_Interno, d.DEFI_IdElemento
			from	Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where	d.DEFI_TipoElemento = 'POST' and d.DEFI_Activo = 1	and
					d.DEFI_Estado != 'O'
)			as				d	on	p.POST_Interno	=	d.DEFI_IdElemento
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						count(distinct SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre))) Cantidad,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)			as				f	on d.DEFI_Interno = f.ARCH_CodTabla
where		a.ALIM_Interno = @Feeder
order by	ElementId
END

/******************************/
/************* SEDS ***********/
/******************************/

CREATE Procedure [dbo].[sp_GetSedsByFeeder]
	@Feeder int
As
Begin
select		CONVERT(int ,row_number() OVER(Order By s.SED_Interno)) StructId,a.ALIM_Codigo FeederCode, s.SED_Interno ElementId, 'SED' ElementType, s.SED_Codigo CodIns, s.SED_Etiqueta Label, 
			isnull(d.CODI_Codigo,'') TypificationCode, s.SED_Tipo SedType, '' StartNode, '' EndNode, isnull(f.Ruta,'') PhotosPath, isnull(f.Cantidad,0) PhotosQuantity
from	    Seds			s
inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
left join	
(
			select		c.CODI_Codigo,	d.DEFI_Interno, d.DEFI_IdElemento
			from		Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where	d.DEFI_TipoElemento = 'SED' and d.DEFI_Activo = 1	and
					d.DEFI_Estado != 'O'
)			as				d	on	s.SED_Interno	=	d.DEFI_IdElemento
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						count(distinct SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre))) Cantidad,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)			as				f	on d.DEFI_Interno = f.ARCH_CodTabla
where		a.ALIM_Interno = @Feeder
order by	ElementId
End


/******************************/
/************ VANOS ***********/
/******************************/

CREATE Procedure  [dbo].[sp_GetGapsByFeeder]
	@Feeder int
As
Begin
select		CONVERT(int ,row_number() OVER(Order By v.VANO_Interno)) StructId,a.ALIM_Codigo FeederCode, v.VANO_Interno ElementId, 'VANO' ElementType, v.VANO_Codigo CodIns, v.VANO_Etiqueta Label, 
			Isnull(d.CODI_Codigo,'') TypificationCode, '' SedType, isnull(d.DEFI_NodoInicial,'') StartNode, isnull(d.DEFI_NodoFinal,'') EndNode, isnull(f.Ruta,'') PhotosPath, isnull(f.Cantidad,0) PhotosQuantity
from		Vanos			v
inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
left join	
(
			select	c.CODI_Codigo, d.DEFI_Interno, d.DEFI_IdElemento, d.DEFI_NodoInicial, d.DEFI_NodoFinal
			from	Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where	d.DEFI_TipoElemento = 'VANO' and d.DEFI_Activo = 1	and
					d.DEFI_Estado != 'O'
)			as				d	on	v.VANO_Interno	=	d.DEFI_IdElemento
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						count(distinct SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre))) Cantidad,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)			as				f	on d.DEFI_Interno = f.ARCH_CodTabla
where		a.ALIM_Interno = @Feeder
order by	ElementId
End