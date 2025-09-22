create or alter procedure sp_archivos_observados
as
begin

select		d.DEFI_CodDef, a.ARCH_CodTabla, substring(a.arch_nombre, 1, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1) - 1) Path
from		Archivos		a
inner join	Deficiencias	d	on	a.ARCH_Tabla	=	'Deficiencias'	and
									a.ARCH_CodTabla	=	d.DEFI_Interno
where		not a.ARCH_Nombre like '%' + d.DEFI_CodDef + '%'
group by	d.DEFI_CodDef, a.ARCH_CodTabla,
substring(a.arch_nombre, 1, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1) - 1)


end
go

create or alter procedure sp_ArchivosCompletarAlimentador
as 
begin
select SUBSTRING(ar.ARCH_Nombre,1,CHARINDEX('/',ar.ARCH_Nombre,19)-1) Ruta, d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno
From Archivos ar
join Deficiencias d on d.DEFI_Interno = ar.ARCH_CodTabla and ar.ARCH_Tabla = 'Deficiencias'
join 
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
)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento
where ar.ARCH_Nombre like 'Defi%' and d.DEFI_Activo =1
group by SUBSTRING(ar.ARCH_Nombre,1,CHARINDEX('/',ar.ARCH_Nombre,19)-1), d.DEFI_TipoElemento, ALIM_Etiqueta, ALIM_Interno
order by ALIM_Etiqueta		
end
go

create or ALTER   procedure [dbo].[sp_archivos_tipificacionDiferente]
as
begin

select		a.arch_codTabla, 
			SUBSTRING(a.ARCH_Nombre, 1, len(a.ARCH_Nombre) - 2) OldPath, c.CODI_Codigo RealTypification
from		Archivos		a
inner join	Deficiencias	d	on	a.ARCH_Tabla	=	'Deficiencias' and
									a.ARCH_CodTabla	=	d.DEFI_Interno
inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
where		d.DEFI_Estado != 'O' and d.DEFI_Activo = 1 and
			c.CODI_Codigo != SUBSTRING(a.ARCH_Nombre, len(a.ARCH_Nombre) - 5, 4)
group by	a.arch_codTabla, SUBSTRING(a.ARCH_Nombre, 1, len(a.ARCH_Nombre) - 2),
			c.CODI_Codigo
end

/****************************/
/***** REPORTE DE SEAL ******/
/****************************/
select		CodEmp,CodDEF,TipINS,ds.CodINS,
			TipDEF,
			case 
				when CodRES is null then da.DEFI_Responsable
				when CodRES=-1 then da.DEFI_Responsable
				else CodRES
			end CodRES,
			case EstSUB
				when 2 then ds.NroSUM
				else da.DEFI_NumSuministro
			end NroSUM,CodDEN,
			FecDEN,FecINS,FecSUB,
			case EstSUB
				when 2 then ds.EstSUB
				else da.DEFI_EstadoSubsanacion
			end EstSub,
			Observ,Refer1,Refer2,CoordX,
			CoordY,CodAMT,UsuCre,UsuNPc,
			FecReg,NroORD,
			isnull(da.DEFI_Comentario, '') ObservacionesArjen,
			case 
				when a.TotalFotos is null then 'Sin modificar' 
				else 'Modificado Por Arjen'
			end Modificado
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
			select		ARCH_Tabla, ARCH_CodTabla, count(*) TotalFotos
			from		Archivos
			group by	ARCH_Tabla, ARCH_CodTabla
)			as						a	on	da.DEFI_Interno	=	a.ARCH_CodTabla	and
											'Deficiencias'	=	a.ARCH_Tabla
where		el.ALIM_Etiqueta in ('alto libertad', 'Corpac', 'portales', 'mariano melgar', 'jorge chavez', 'porongoche', 'cerro colorado') and
			da.DEFI_Activo = 1
union all
select		'SEA' CodEmp,da.DEFI_CodDef CodDEF, 
			case el.TipoElemento
				when 'SED' then 1
				when 'POST' then 2
				else 3
			end TipIns, el.CodIns,
			co.CODI_Codigo TipDEF, 
			case da.DEFI_Responsable
				when 0 then 'Concesionaria'
				else 'Tercero'
			end CodRES,
			da.DEFI_NumSuministro NroSUM,
			da.DEFI_CodDen CodDEN,
			da.DEFI_FechaDenuncia FecDEN, da.DEFI_FechaInspeccion FecINS,da.DEFI_FechaSubsanacion FecSUB,
			da.DEFI_EstadoSubsanacion EstSUB,
			da.DEFI_Comentario Observ, da.DEFI_NodoInicial Refer1,
			da.DEFI_NodoFinal Refer2, el.Latitud CoordX,
			el.Longitud CoordY, el.ALIM_Codigo CodAMT, 'Arjen' UsuCre, '' UsuNPc,
			da.DEFI_FecRegistro, '' NroORD,
			'' ObservacionesArjen,
			'Modificado Por Arjen' Modificado
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
			select		ARCH_Tabla, ARCH_CodTabla, count(*) TotalFotos
			from		Archivos
			group by	ARCH_Tabla, ARCH_CodTabla
)			as						a	on	da.DEFI_Interno	=	a.ARCH_CodTabla	and
											'Deficiencias'	=	a.ARCH_Tabla
where		da.DEFI_Estado = 'N' and el.ALIM_Etiqueta in ('alto libertad', 'Corpac', 'portales', 'mariano melgar', 'jorge chavez', 'porongoche', 'cerro colorado') and
			da.DEFI_Activo = 1