/****************************/
/********* POSTES ***********/
/****************************/
select		a.ALIM_Codigo CodAlimentador, a.ALIM_Etiqueta Alimentador, p.POST_CodigoNodo CodigoNodoPoste, p.POST_Etiqueta EtiquetaPoste, 
			d.DEFI_CodDef CodDeficiencia, 
			case d.DEFI_Estado
				when 'S' then 'Seal'
				when 'N' then 'Nueva Deficiencia'
				else 'Sin Deficiencia'
			end Origen,
			isnull(c.CODI_Codigo, '') CodTipificacion, isnull(t.TIPO_Descripcion, '') Tipificacion, d.DEFI_FechaDenuncia FechaDenuncia, d.DEFI_FechaInspeccion FechaInspeccion,
			d.DEFI_FechaSubsanacion FechaSubsanacion, isnull(d.DEFI_Observacion, '') Observacion, isnull(d.DEFI_EstadoSubsanacion, '') EstadoSubsanacion, 
			isnull(d.DEFI_Comentario, '') Comentario, ar.[1] Foto1, ar.[2] Foto2, ar.[3] Foto3, ar.[4] Foto4, ar.[5] Foto5, ar.[6] Foto6
from		Postes			p
inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
left join	Deficiencias	d	on	p.POST_Interno	=	d.DEFI_IdElemento	and
									'POST'			=	d.DEFI_TipoElemento
left join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
left join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
left join	(
			select		*
			from
			(
						select		SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre)) PhotoType,
									ARCH_CodTabla DEFI_Interno, ARCH_Interno
						from		Archivos
						where		ARCH_Tabla = 'Deficiencias'
			)			as			Archivos
			pivot (
						count(ARCH_Interno)
						for PhotoType in ([1],[2],[3],[4],[5],[6])
			)			as pivotTable
)			as				ar	on	d.DEFI_Interno	=	ar.DEFI_Interno
where		a.ALIM_Etiqueta = 'mariano melgar'
order by	p.POST_Interno

/****************************/
/************ SED ***********/
/****************************/

select		a.ALIM_Codigo CodAlimentador, a.ALIM_Etiqueta Alimentador, s.SED_Codigo CodigoSed, s.SED_Etiqueta EtiquetaSed, 
			d.DEFI_CodDef CodDeficiencia, 
			case d.DEFI_Estado
				when 'S' then 'Seal'
				when 'N' then 'Nueva Deficiencia'
				else 'Sin Deficiencia'
			end Origen,
			isnull(c.CODI_Codigo, '') CodTipificacion, isnull(t.TIPO_Descripcion, '') Tipificación, d.DEFI_FechaDenuncia FechaDenuncia, d.DEFI_FechaInspeccion FechaInspeccion,
			d.DEFI_FechaSubsanacion FechaSubsanacion, isnull(d.DEFI_Observacion, '') Observacion, isnull(d.DEFI_EstadoSubsanacion, '') EstadoSubsanacion, 
			isnull(d.DEFI_Comentario, '') Comentario, ar.[1] Foto1, ar.[2] Foto2, ar.[3] Foto3, ar.[4] Foto4, ar.[5] Foto5, ar.[6] Foto6
from		Seds			s
inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
left join	Deficiencias	d	on	s.SED_Interno	=	d.DEFI_IdElemento	and
									'SED'			=	d.DEFI_TipoElemento
left join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
left join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
left join	(
			select		*
			from
			(
						select		SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre)) PhotoType,
									ARCH_CodTabla DEFI_Interno, ARCH_Interno
						from		Archivos
						where		ARCH_Tabla = 'Deficiencias'
			)			as			Archivos
			pivot (
						count(ARCH_Interno)
						for PhotoType in ([1],[2],[3],[4],[5],[6])
			)			as pivotTable
)			as				ar	on	d.DEFI_Interno	=	ar.DEFI_Interno
where		a.ALIM_Etiqueta = 'mariano melgar'
order by	s.SED_Interno

/****************************/
/********** VANOS ***********/
/****************************/
select		a.ALIM_Codigo CodAlimentador, a.ALIM_Etiqueta Alimentador, v.VANO_Codigo CodigoVano, v.VANO_Etiqueta EtiquetaVano, 
			d.DEFI_CodDef CodDeficiencia, 
			case d.DEFI_Estado
				when 'S' then 'Seal'
				when 'N' then 'Nueva Deficiencia'
				else 'Sin Deficiencia'
			end Origen,
			isnull(c.CODI_Codigo, '') CodTipificacion, isnull(t.TIPO_Descripcion, '') Tipificacion, d.DEFI_FechaDenuncia FechaDenuncia, d.DEFI_FechaInspeccion FechaInspeccion,
			d.DEFI_FechaSubsanacion FechaSubsanacion, isnull(d.DEFI_Observacion, '') Observacion, isnull(d.DEFI_EstadoSubsanacion, '') EstadoSubsanacion, 
			isnull(d.DEFI_Comentario, '') Comentario, ar.[1] Foto1, ar.[2] Foto2, ar.[3] Foto3, ar.[4] Foto4, ar.[5] Foto5, ar.[6] Foto6
from		Vanos			v
inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
left join	Deficiencias	d	on	v.VANO_Interno	=	d.DEFI_IdElemento	and
									'VANO'			=	d.DEFI_TipoElemento
left join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
left join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
left join	(
			select		*
			from
			(
						select		SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre)) PhotoType,
									ARCH_CodTabla DEFI_Interno, ARCH_Interno
						from		Archivos
						where		ARCH_Tabla = 'Deficiencias'
			)			as			Archivos
			pivot (
						count(ARCH_Interno)
						for PhotoType in ([1],[2],[3],[4],[5],[6])
			)			as pivotTable
)			as				ar	on	d.DEFI_Interno	=	ar.DEFI_Interno
where		a.ALIM_Etiqueta = 'mariano melgar'
order by	v.VANO_Interno