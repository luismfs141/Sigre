Create or Alter procedure sp_ArchivosDefSinDef
@Feeder int
as 
begin
Select distinct SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2) RouteDEF, case
																when a.ARCH_Nombre like '%POST%'
																Then
																	REPLACE(SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1) - 1)
																			,'Deficiencias/POST','Sin Deficiencias')
																when a.ARCH_Nombre like '%VANO%'
																Then
																	REPLACE(SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1) - 1)
																			,'Deficiencias/VANO','Sin Deficiencias')
																else
																	REPLACE(SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1) - 1)
																			,'Deficiencias/SED','Sin Deficiencias')
																End RouteSinDef
from Deficiencias as d
join Archivos as a on a.ARCH_CodTabla = d.DEFI_Interno and d.DEFI_Interno = @Feeder
end
go


Create or Alter procedure [dbo].[sp_ArchivosEliminados]
@Feeder int
as
Begin
select distinct d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno, case
														When a.ARCH_Nombre like'%/Deficiencias/%'
														then SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre,CHARINDEX('/',a.ARCH_Nombre)+1) + 1) + 1) + 1) - 1)
														else
															SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre) + 1) + 1) - 1)
														end Ruta

From Archivos a
join Deficiencias d on d.DEFI_Interno = a.ARCH_CodTabla and a.ARCH_Tabla = 'Deficiencias'
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
where  d.DEFI_Activo =0 and ALIM_Interno = @Feeder
except
select distinct d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno, case
														When a.ARCH_Nombre like'%/Deficiencias/%'
														then SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre,CHARINDEX('/',a.ARCH_Nombre)+1) + 1) + 1) + 1) - 1)
														else
															SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre) + 1) + 1) - 1)
														end Ruta

From Archivos a
join Deficiencias d on d.DEFI_Interno = a.ARCH_CodTabla and a.ARCH_Tabla = 'Deficiencias'
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
where  d.DEFI_Activo =1 and ALIM_Interno = @Feeder
order by ALIM_Etiqueta
end
go

Create or Alter Procedure sp_ListaCompletaArchivos
@Feeder int
as
Begin
select  d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno, a.ARCH_Nombre Ruta

From Archivos a
join Deficiencias d on d.DEFI_Interno = a.ARCH_CodTabla and a.ARCH_Tabla = 'Deficiencias'
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
where  d.DEFI_Activo =1 and ALIM_Interno = @Feeder
order by ALIM_Etiqueta
end
go