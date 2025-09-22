/*******************************************************/
/*** CORRIGE DEFICIENCIAS CON TIPIFICACIÓN REPETIDA ****/
/*******************************************************/
declare @CodIns varchar(20) = '3371'
declare @TipoElemento varchar(4) = 'SED'

select		c.CODI_Codigo, d.*
from		
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)			as	el
inner join	Deficiencias	d	on	el.TipoElemento	=	d.DEFI_TipoElemento	and
									el.IdElemento	=	d.DEFI_IdElemento
inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
where		el.CodIns = @CodIns and el.TipoElemento = @TipoElemento and d.DEFI_EstadoSubsanacion != 2

declare @DEFI_Seal int = 3750
declare @DEFI_Nuevo int = 42035

update		de
set			de.TABL_Interno				= dn.TABL_Interno,			de.DEFI_DistHorizontal	= dn.DEFI_DistHorizontal,
			de.DEFI_DistVertical		= dn.DEFI_DistVertical,		de.DEFI_FecModificacion	= GETDATE(),
			de.DEFI_TipoMaterial		= dn.DEFI_TipoMaterial,		de.DEFI_NodoInicial		= dn.DEFI_NodoInicial,
			de.DEFI_NodoFinal			= dn.DEFI_NodoFinal,		de.DEFI_TipoRetenida	= dn.DEFI_TipoRetenida,
			de.DEFI_RetenidaMaterial	= dn.DEFI_RetenidaMaterial,	de.DEFI_TipoArmado		= dn.DEFI_TipoArmado,
			de.DEFI_ArmadoMaterial		= dn.DEFI_NumPostes,		de.DEFI_PozoTierra		= dn.DEFI_PozoTierra,
			de.DEFI_PozoTierra2			= dn.DEFI_PozoTierra2,		de.DEFI_Responsable		= dn.DEFI_Responsable,
			de.DEFI_Comentario			= dn.DEFI_Comentario,		de.DEFI_UsuarioInic		= dn.DEFI_UsuarioInic,
			de.DEFI_UsuarioMod			= 1
from		Deficiencias	de
inner join
(
			select		@DEFI_Seal DEFI_Seal, *
			from		Deficiencias
			where		DEFI_Interno = @DEFI_Nuevo
)			as				dn		on	de.DEFI_Interno	= dn.DEFI_Seal
where		de.DEFI_Interno = @DEFI_Seal

update		Archivos
set			ARCH_CodTabla = @DEFI_Seal
where		ARCH_Tabla = 'Deficiencias' and ARCH_CodTabla = @DEFI_Nuevo

update		Deficiencias
set			DEFI_Activo = 0
where		DEFI_Interno = @DEFI_Nuevo

/*******************************************************/
/******** DEFICIENCIAS CON TIPIFICACIÓN REPETIDA *******/
/*******************************************************/
select		el.ALIM_Etiqueta Alimentador, dn.DEFI_Estado Origen, el.TipoElemento, el.CodIns, el.CodElemento, 
			de.DEFI_CodDef CodDeficiencia, dn.CODI_Codigo CodTipificacion, dn.DEFI_NodoInicial NodoInicial, dn.DEFI_NodoFinal NodoFinal,
			dn.DEFI_DistHorizontal DistHorizontal, dn.DEFI_DistVertical DistVertical, de.DEFI_FechaDenuncia FechaDenuncia,
			de.DEFI_FechaInspeccion FechaInspecccion, de.DEFI_FechaSubsanacion FechaSubsanacion, dn.DEFI_Comentario Comentario, 
			de.DEFI_EstadoSubsanacion EstadoSubsanacion, de.DEFI_FecModificacion
from		
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)			as	el
left join	
(
			select		c.CODI_Codigo, d.*
			from		Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where		DEFI_Activo = 1 and d.DEFI_Estado in ('N','O')
)			as	dn		on	el.IdElemento	=	dn.DEFI_IdElemento	and
							el.TipoElemento	=	dn.DEFI_TipoElemento
left join
(
			select		c.CODI_Codigo, d.*
			from		Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where		DEFI_Activo = 1 and DEFI_Estado = 'S' and DEFI_EstadoSubsanacion != 2 --and DEFI_FecModificacion is null
)			as	de	on	dn.DEFI_TipoElemento	=	de.DEFI_TipoElemento	and
						dn.DEFI_IdElemento		=	de.DEFI_IdElemento
where		el.ALIM_Etiqueta in ('portales') and dn.CODI_Codigo = de.CODI_Codigo
order by	el.TipoElemento

/*******************************************************/
/************* DEFICIENCIAS NUEVAS Y SIN DEF ***********/
/*******************************************************/
select		el.ALIM_Etiqueta Alimentador, el.TipoElemento, el.CodIns, do.DEFI_UsuarioMod, do.DEFI_FechaCreacion, do.DEFI_FecModificacion, do.Nombres, dn.DEFI_CodDef
from		
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)			as	el
inner join	
(
			select		c.CODI_Codigo, u.USUA_Nombres + ' ' + u.USUA_Apellidos Nombres, d.*
			from		Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			left join	Usuarios		u	on	d.DEFI_UsuarioMod	=	u.USUA_Imei
			where		DEFI_Activo = 1 and d.DEFI_Estado in ('O')
)			as	do		on	el.IdElemento	=	do.DEFI_IdElemento	and
							el.TipoElemento	=	do.DEFI_TipoElemento
inner join
(
			select		c.CODI_Codigo, d.*
			from		Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where		DEFI_Activo = 1 and DEFI_Estado = 'N' and not c.CODI_Codigo in (2086)--and DEFI_FecModificacion is null
)			as	dn	on	do.DEFI_TipoElemento	=	dn.DEFI_TipoElemento	and
						do.DEFI_IdElemento		=	dn.DEFI_IdElemento
where		el.ALIM_Etiqueta in ('portales') 
order by	el.TipoElemento

/*******************************************************/
/************* SIN DEF CON DEFICIENCIAS EN 0 ***********/
/*******************************************************/
select		el.ALIM_Etiqueta Alimentador, el.TipoElemento, el.CodIns, dn.DEFI_CodDef
from		
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)			as	el
inner join	
(
			select		c.CODI_Codigo, d.*
			from		Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where		DEFI_Activo = 1 and d.DEFI_Estado in ('O')
)			as	do		on	el.IdElemento	=	do.DEFI_IdElemento	and
							el.TipoElemento	=	do.DEFI_TipoElemento
inner join
(
			select		c.CODI_Codigo, d.*
			from		Deficiencias	d
			inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			where		DEFI_Activo = 1 and DEFI_Estado = 'S' and DEFI_EstadoSubsanacion != 2
)			as	dn	on	do.DEFI_TipoElemento	=	dn.DEFI_TipoElemento	and
						do.DEFI_IdElemento		=	dn.DEFI_IdElemento
where		el.ALIM_Etiqueta in ('portales') 
order by	el.TipoElemento

/******************************************************/
/************ DEFICIENCIAS SIN FOTOS ******************/
/******************************************************/
select		el.ALIM_Etiqueta Alimentador, el.TipoElemento TipoElemento, el.CodIns, d.DEFI_CodDef CodDef, a.TotalFotos
from		Deficiencias		d
inner join
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)			as					el	on	d.DEFI_IdElemento	=	el.IdElemento	and
										d.DEFI_TipoElemento	=	el.TipoElemento
left join	
(
			select		ARCH_Tabla, ARCH_CodTabla, count(ARCH_Interno) TotalFotos
			from		Archivos
			group by	ARCH_Tabla, ARCH_CodTabla
)			as					a	on	d.DEFI_Interno	=	a.ARCH_CodTabla	and
										'Deficiencias'	=	a.ARCH_Tabla
where		el.ALIM_Etiqueta in ('alto libertad','cerro colorado','corpac','jorge chavez','mariano melgar', 'portales') and
			d.DEFI_EstadoSubsanacion != 2 and TotalFotos is null
order by	el.ALIM_Etiqueta

/********************************************************/
/* DEFICIENCIAS QUE NO DEBEN TENER FECHA DE SUBSANACIÓN */
/********************************************************/
select		ds.EstSUB EstadoSeal, ds.FecSUB FechaSubsanacionSeal, el.ALIM_Etiqueta Alimentador, 
			d.DEFI_CodDef CodDeficiencia, el.CodIns, d.DEFI_FechaSubsanacion FechaSubsanacion, d.DEFI_EstadoSubsanacion EstadoSubsanacion
from		deficiencias		d
left join	DeficienciasSeal	ds	on	d.defi_coddef = ds.codDef
left join	
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)			as					el	on	d.DEFI_IdElemento	=	el.IdElemento	and
										d.DEFI_TipoElemento	=	el.TipoElemento
where		d.defi_estadoSubsanacion = 0 and not d.DEFI_FechaSubsanacion is null and
			d.DEFI_Activo = 1
order by	el.ALIM_Etiqueta