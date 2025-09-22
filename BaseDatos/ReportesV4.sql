/****************************/
/********* POSTES ***********/
/****************************/
select		a.ALIM_Codigo CodAlimentador, a.ALIM_Etiqueta Alimentador,d.DEFI_TipoElemento, p.POST_Latitud Latitud, p.POST_Longitud Longitud,
			p.POST_CodigoNodo CodigoNodoPoste, p.POST_Etiqueta EtiquetaPoste, 
			d.DEFI_CodDef CodDeficiencia,
			case d.DEFI_Estado
				when 'S' then 'Seal'
				when 'N' then 'Nueva Deficiencia'
				else 'Sin Deficiencia'
			end Origen,
			isnull(c.CODI_Codigo, '') CodTipificacion, isnull(t.TIPO_Descripcion, '') Tipificacion,isNull(d.DEFI_NumSuministro,'')[Num. Suministro],
			d.DEFI_Responsable Responsable,
			isnull(d.DEFI_TipoMaterial,'') [Tipo Material],isnull(d.DEFI_TipoRetenida,'') Retenida, isnull(d.DEFI_TipoArmado,'') Armado,
			isnull(d.DEFI_ArmadoMaterial,'') [Armado Material],d.DEFI_DistHorizontal Horizontal, d.DEFI_DistVertical Vertical , d.DEFI_FechaDenuncia FechaDenuncia, d.DEFI_FechaInspeccion FechaInspeccion,
			d.DEFI_FechaSubsanacion FechaSubsanacion, d.DEFI_FecModificacion, d.DEFI_FecRegistro, isnull(d.DEFI_Observacion, '') Observacion, isnull(d.DEFI_EstadoSubsanacion, '') EstadoSubsanacion, 
			isnull(d.DEFI_Comentario, '') Comentario, isNull(us.Registrador,'') Registrador,d.DEFI_Activo Activo, ar.[1] Foto1, ar.[2] Foto2, ar.[3] Foto3, ar.[4] Foto4, ar.[5] Foto5, ar.[6] Foto6, arc.Ruta
from		Postes			p
inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
left join	Deficiencias	d	on	p.POST_Interno	=	d.DEFI_IdElemento	and
									'POST'			=	d.DEFI_TipoElemento
left join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
left join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
left Join	
(
			Select a.ARCH_CodTabla, SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2) Ruta
			From  Archivos a
			group by SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2), a.ARCH_CodTabla
)							AS arc	on d.DEFI_Interno = arc.ARCH_CodTabla
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
left join (
			select u.USUA_Nombres Registrador, u.USUA_Imei Imei
			From Usuarios as u 
) as us on us.Imei = d.DEFI_UsuarioMod


where		a.ALIM_Etiqueta in ('Cerro Colorado','Miguel Grau','Zamacola') and d.DEFI_Activo =1 and ( d.DEFI_FecRegistro>='2023-01-10' or DEFI_FecModificacion >= '2023-01-10')
order by	ALIM_Etiqueta, d.DEFI_UsuarioMod, p.POST_Interno

/****************************/
/************ SED ***********/
/****************************/

select		a.ALIM_Codigo CodAlimentador, a.ALIM_Etiqueta Alimentador,CONCAT(d.DEFI_TipoElemento,'- ',s.SED_Tipo) Tipo, s.SED_Latitud Latitud, s.SED_Longitud Longitud,
			s.SED_Codigo CodigoSed, s.SED_Etiqueta EtiquetaSed, 
			d.DEFI_CodDef CodDeficiencia,
			case d.DEFI_Estado
				when 'S' then 'Seal'
				when 'N' then 'Nueva Deficiencia'
				else 'Sin Deficiencia'
			end Origen,
			isnull(c.CODI_Codigo, '') CodTipificacion, isnull(t.TIPO_Descripcion, '') Tipificación, isNull(d.DEFI_NumSuministro,'') [Num. Suministro],
			d.DEFI_Responsable Reponsable,
			isnull(d.DEFI_TipoMaterial,'') [Tipo Material],isnull(d.DEFI_TipoRetenida,'') Retenida, isnull(d.DEFI_TipoArmado,'') Armado,
			isnull(d.DEFI_ArmadoMaterial,'') [Armado Material], d.DEFI_DistHorizontal Horizontal, d.DEFI_DistVertical Vertical,isnull(d.DEFI_PozoTierra,'') [Pozo Tierra 1],isnull(d.DEFI_PozoTierra2,'') [Pozo Tierra2],
			d.DEFI_FechaDenuncia FechaDenuncia, d.DEFI_FechaInspeccion FechaInspeccion,d.DEFI_FechaSubsanacion FechaSubsanacion, d.DEFI_FecModificacion, d.DEFI_FecRegistro, 
			isnull(d.DEFI_Observacion, '') Observacion, isnull(d.DEFI_EstadoSubsanacion, '') EstadoSubsanacion, 
			isnull(d.DEFI_Comentario, '') Comentario,isNull(us.Registrador,'') Registrador,d.DEFI_Activo Activo, ar.[1] Foto1, ar.[2] Foto2, ar.[3] Foto3, ar.[4] Foto4, ar.[5] Foto5, ar.[6] Foto6,arc.Ruta
from		Seds			s
inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
left join	Deficiencias	d	on	s.SED_Interno	=	d.DEFI_IdElemento	and
									'SED'			=	d.DEFI_TipoElemento
left join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
left join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)							AS arc	on d.DEFI_Interno = arc.ARCH_CodTabla

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
left join (
			select u.USUA_Nombres Registrador, u.USUA_Imei Imei
			From Usuarios as u 
) as us on us.Imei = d.DEFI_UsuarioMod
where		a.ALIM_Etiqueta in ('Cerro Colorado','Miguel Grau','Zamacola') and d.DEFI_Activo =1 and ( d.DEFI_FecRegistro>= '2023-01-10' or DEFI_FecModificacion >= '2023-01-10')
order by	ALIM_Etiqueta, d.DEFI_UsuarioMod, s.SED_Interno

/****************************/
/********** VANOS ***********/
/****************************/
select		a.ALIM_Codigo CodAlimentador, a.ALIM_Etiqueta Alimentador,d.DEFI_TipoElemento, v.VANO_Codigo CodigoVano, v.VANO_Etiqueta EtiquetaVano,
			isnull(d.DEFI_TipoMaterial,'')[Tipo Material],isnull(d.DEFI_CodDef,'') CodDeficiencia,
			
			case d.DEFI_Estado
				when 'S' then 'Seal'
				when 'N' then 'Nueva Deficiencia'
				else 'Sin Deficiencia'
			end Origen,
			isnull(c.CODI_Codigo, '') CodTipificacion, isnull(t.TIPO_Descripcion, '') Tipificacion,isnull(d.DEFI_NumSuministro,'') [Num. Suministro],
			isnull(d.DEFI_Responsable,'') Reponsable,isnull(d.DEFI_NodoInicial,'')[Nodo Inicial],isnull(d.DEFI_NodoFinal,'')[Nodo Final],
			isnull(d.DEFI_DistHorizontal,0)[Dist. Horizontal],isnull(d.DEFI_DistVertical,0) [Dist. Vertical],
			d.DEFI_FechaDenuncia FechaDenuncia, d.DEFI_FechaInspeccion FechaInspeccion,
			d.DEFI_FechaSubsanacion FechaSubsanacion,d.DEFI_FecModificacion, d.DEFI_FecRegistro, isnull(d.DEFI_Observacion, '') Observacion, isnull(d.DEFI_EstadoSubsanacion, '') EstadoSubsanacion, 
			isnull(d.DEFI_Comentario, '') Comentario,isNull(us.Registrador,'') Registrador,d.DEFI_Activo Activo, ar.[1] Foto1, ar.[2] Foto2, ar.[3] Foto3, ar.[4] Foto4, ar.[5] Foto5, ar.[6] Foto6,arc.Ruta
from		Vanos			v
inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
left join	Deficiencias	d	on	v.VANO_Interno	=	d.DEFI_IdElemento	and
									'VANO'			=	d.DEFI_TipoElemento
left join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
left join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)							AS arc	on d.DEFI_Interno = arc.ARCH_CodTabla
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
left join (
			select u.USUA_Nombres Registrador, u.USUA_Imei Imei
			From Usuarios as u 
) as us on us.Imei = d.DEFI_UsuarioMod
where		a.ALIM_Etiqueta in ('Cerro Colorado','Miguel Grau','Zamacola') and d.DEFI_Activo =1 and ( d.DEFI_FecRegistro>= '2023-01-10' or DEFI_FecModificacion >= '2023-01-10')
order by	ALIM_Etiqueta, d.DEFI_UsuarioMod, v.VANO_Interno