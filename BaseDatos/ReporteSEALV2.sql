/****************************/--2673
/***** REPORTE DE SEAL ******/--2188
/****************************/--485
select		CodEmp,CodDEF,TipINS,da.DEFI_CodigoElemento Etiqueta,ds.CodINS,
			TipDEF,
			case EstSUB
				when 2 then CodRes
				else
					case 
						when CodRES = -1 then da.DEFI_Responsable
						when CodRES is null then da.DEFI_Responsable
						else CodRES
					end
			end CodRES,
			case EstSUB
				when 2 then ds.NroSUM
				else da.DEFI_NumSuministro
			end NroSUM,CodDEN,
			DATEFROMPARTS(
					SUBSTRING(FecDEN, 7,4),
					SUBSTRING(FecDEN, 4,2),
					SUBSTRING(FecDEN, 1,2)) FecDEN,
			DATEFROMPARTS(
					SUBSTRING(FecINS, 7,4),
					SUBSTRING(FecINS, 4,2),
					SUBSTRING(FecINS, 1,2)) FecINS,
			case
				when ds.EstSub = 0 and da.DEFI_EstadoSubsanacion in (1,2) then da.DEFI_FechaSubsanacion
				else case 
						when isdate(concat(
							SUBSTRING(FecSUB, 7,4), '-',
							SUBSTRING(FecSUB, 4,2), '-',
							SUBSTRING(FecSUB, 1,2))) = 1 then
							DATEFROMPARTS(
							SUBSTRING(FecSUB, 7,4),
							SUBSTRING(FecSUB, 4,2),
							SUBSTRING(FecSUB, 1,2))
						else null
					end 
				end FecSUB,
			case EstSUB
				when 2 then ds.EstSUB
				when 1 then da.defi_EstadoSubsanacion
				else da.DEFI_EstadoSubsanacion
			end EstSub,
			null DistHor,null DistVert,Observ,Refer1,Refer2,CoordX,
			CoordY,CodAMT,UsuCre,UsuNPc,
			FecReg,NroORD,
			isnull(da.DEFI_Comentario, '') ObservacionesArjen,
			case 
				when a.TotalFotos is null then 'Sin modificar' 
				else 'Modificado Por Arjen'
			end Modificado,
			case 
				when a.Ruta is not null and a.Ruta like '%POST%' and a.Ruta not like '%SEA%' then replace(a.ruta,'/POST/','/POST/SEA')
				when a.Ruta is not null and a.Ruta like '%VANO%' and a.Ruta not like '%SEA%' then replace(a.ruta,'/VANO/','/VANO/SEA')
				else 
					case 
						when a.Ruta is null then ''
						else a.Ruta
					end
			end RAIZ
from		DeficienciasSeal		ds
inner join	Deficiencias			da	on	ds.CodDEF	=	da.DEFI_CodDef
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
			inner join	Alimentadores	a	on	v.ALIM_Interno		=	a.ALIM_Interno
)			as						el	on	da.DEFI_IdElemento		=	el.IdElemento and
											da.DEFI_TipoElemento	=	el.TipoElemento
left join
(
			select		ARCH_Tabla, ARCH_CodTabla, count(*) TotalFotos,SUBSTRING(ARCH_Nombre,1,LEN(ARCH_Nombre)-2) ruta
			from		Archivos
			group by	ARCH_Tabla, ARCH_CodTabla,SUBSTRING(ARCH_Nombre,1,LEN(ARCH_Nombre)-2)
)			as						a	on	da.DEFI_Interno	=	a.ARCH_CodTabla	and
											'Deficiencias'	=	a.ARCH_Tabla
where		el.ALIM_Etiqueta in ('alto libertad', 'Corpac', 'portales', 'mariano melgar', 'jorge chavez', 'porongoche') and
			da.DEFI_Activo = 1
union all
select		'SEA' CodEmp,da.DEFI_CodDef CodDEF, 
			case el.TipoElemento
				when 'SED' then 1
				when 'POST' then 2
				else 3
			end TipIns,el.CodElemento, el.CodIns,
			co.CODI_Codigo TipDEF, 
			da.DEFI_Responsable CodRes,
			da.DEFI_NumSuministro NroSUM,
			da.DEFI_CodDen CodDEN,
			da.DEFI_FechaDenuncia FecDEN, da.DEFI_FechaInspeccion FecINS,da.DEFI_FechaSubsanacion FecSUB,
			da.DEFI_EstadoSubsanacion EstSUB,
			da.DEFI_DistHorizontal,da.DEFI_DistVertical,
			da.DEFI_Comentario Observ, da.DEFI_NodoInicial Refer1,
			da.DEFI_NodoFinal Refer2, el.Latitud CoordX,
			el.Longitud CoordY, el.ALIM_Codigo CodAMT, 'Arjen' UsuCre, '' UsuNPc,
			da.DEFI_FecRegistro, '' NroORD,
			'' ObservacionesArjen,
			'Modificado Por Arjen' Modificado,
			case 
				when ar.Ruta is not null and ar.Ruta like '%POST%' and ar.Ruta not like '%SEA%' then replace(ar.ruta,'/POST/','/POST/SEA')
				when ar.Ruta is not null and ar.Ruta like '%VANO%' and ar.Ruta not like '%SEA%' then replace(ar.ruta,'/VANO/','/VANO/SEA')
				else 
					case 
						when ar.Ruta is null then ''
						else ar.Ruta
					end
			end RAIZ
from		Deficiencias	da
inner join	Tipificaciones	ti	on	da.TIPI_Interno	=	ti.TIPI_Interno
inner join	Codigos			co	on	ti.CODI_Interno	=	co.CODI_Interno
inner join
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Codigo, a.ALIM_Etiqueta, p.POST_Latitud Latitud, p.POST_Longitud Longitud
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Codigo, a.ALIM_Etiqueta, s.SED_Latitud Latitud, s.SED_Longitud Longitud
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Codigo, a.ALIM_Etiqueta, VANO_LatitudIni Latitud, v.VANO_LongitudFin Longitud
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno		=	a.ALIM_Interno
)			as						el	on	da.DEFI_IdElemento		=	el.IdElemento and
											da.DEFI_TipoElemento	=	el.TipoElemento
left join
(
			select		ARCH_Tabla, ARCH_CodTabla, count(*) TotalFotos,SUBSTRING(ARCH_Nombre,1,LEN(ARCH_Nombre)-2) ruta
			from		Archivos
			group by	ARCH_Tabla, ARCH_CodTabla,SUBSTRING(ARCH_Nombre,1,LEN(ARCH_Nombre)-2)
)			as						ar	on	da.DEFI_Interno	=	ar.ARCH_CodTabla	and
											'Deficiencias'	=	ar.ARCH_Tabla
where		da.DEFI_Estado = 'N' and el.ALIM_Etiqueta in ('alto libertad', 'Corpac', 'portales', 'mariano melgar', 'jorge chavez', 'porongoche') and
			da.DEFI_Activo = 1