--LISTA LOS ARCHIVOS QUE NO CONTIENEN SEA

CREATE OR ALTER   Procedure [dbo].[sp_ArchivosSinSEA]
	@Feeder int
AS
Begin
Select ele.Interno IdElemento ,DEFI_TipoElemento Tipo,ALIM_Interno IdAlimentador, substring(a.arch_nombre, 1, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1) - 1)as Ruta,
		 substring(a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1)+1 , 12) CodDef
From Deficiencias as d
Join
(
		select  p.POST_Interno Interno,p.POST_Etiqueta Etiqueta,'POST' Tipo, p.ALIM_Interno 
		from Postes as p
		where ALIM_Interno =@Feeder
		union all
		select v.VANO_Interno, v.VANO_Etiqueta,'VANO' Tipo, v.ALIM_Interno
		from Vanos as v
		where ALIM_Interno =@Feeder
) as ele on ele.Interno = d.DEFI_IdElemento and ele.Tipo = d.DEFI_TipoElemento
join Archivos as a on a.ARCH_CodTabla = d.DEFI_Interno and a.ARCH_Tabla = 'Deficiencias'
where a.ARCH_Nombre not like '%SEA%'
Group by ele.Interno,DEFI_TipoElemento,ALIM_Interno, substring(a.arch_nombre, 1, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1) - 1),
			substring(a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.ARCH_Nombre) + 1) + 1) + 1)+1 , 12)
Order by DEFI_TipoElemento
END
GO

--OBTIENE TODAS LAS RUTAS DE LAS FOTOS DE UN ALIMENTADOR
create or alter procedure sp_ArchivosPorAlimentador
@Feeder int
as 
begin
select ar.ARCH_Nombre Ruta,SubString(ar.ARCH_Nombre,LEN(ar.ARCH_Nombre),LEN(ar.ARCH_Nombre)) ultCarpeta,d.DEFI_Estado, d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno
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
where d.DEFI_Activo =1 and ALIM_Interno = @Feeder
group by ar.ARCH_Nombre, d.DEFI_Estado, d.DEFI_TipoElemento, ALIM_Etiqueta, ALIM_Interno
order by ALIM_Etiqueta
end
go

--OBTIENE LA RUTA DE FOTOS DE UNA DEFICIENCIA PARA CAMBIAR A SIN DEFICIENCIA
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

--OBTIENE LA LISTA DE TODOS LOS DEFICIENCIAS ELIMINADAS
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

--OBTIENE LA LISTA COMPLETA DE DEFICIENCIAS ACTIVAS DE UN ALIMENTADOR
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

--LISTA DE ARCHIVOS CON FOTOS FALTANTES
Create or Alter procedure sp_ArchivosIncompletosLista
@Feeder int
As
Begin
Select a.ARCH_CodTabla Codigo,SUBSTRING(REPLACE(a.ARCH_Nombre,'/000','/SEA000'),1,LEN(REPLACE(a.ARCH_Nombre,'/000','/SEA000'))-2) Ruta, count(a.ARCH_CodTabla) NroFotos--149
From Deficiencias as d
join Archivos as a on a.ARCH_CodTabla = d.DEFI_Interno
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
)	as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento and ALIM_Interno = @Feeder
where d.DEFI_Activo = 1 and d.DEFI_Estado <> 'O'
Group by SUBSTRING(REPLACE(a.ARCH_Nombre,'/000','/SEA000'),1,LEN(REPLACE(a.ARCH_Nombre,'/000','/SEA000'))-2), a.ARCH_CodTabla
Having count(a.ARCH_CodTabla) < 4
Order By Ruta
End
GO

--LISTA POZOS SIN DEFICIENCIA CON RUTA INCORRECTA
Create or Alter procedure sp_corregir_pozos (
@feeder int
)as 
begin
Select Ar.ARCH_Nombre,Ar.ARCH_CodTabla, 
REPLACE( REPLACE(Ar.ARCH_Nombre,'Deficiencias/SED/','Sin Deficiencias/'),Convert(varchar, Ar.ARCH_CodTabla) +'/2086/','') as Corregido
from Alimentadores A
join Deficiencias D on A.ALIM_Codigo = D.DEFI_CodAMT
join Archivos Ar on D.DEFI_Interno = Ar.ARCH_CodTabla
where A.ALIM_Interno = @feeder and D.DEFI_Estado = 'O' and Ar.ARCH_Nombre like '%/Deficiencias/%'
end
go


---Obtiene la ruta la ruta final de las carpetas por codigo de alimentador


create or alter procedure sp_GetPathFinal (
@feeder int
)
as
begin
select D.DEFI_FecRegistro, 
				SUBSTRING(	case 
						when A.ARCH_Nombre is not null and D.DEFI_TipoElemento = 'POST' and A.ARCH_Nombre not like '%SEA%' then replace(A.ARCH_Nombre,'/POST/','/POST/SEA')
						when A.ARCH_Nombre is not null and D.DEFI_TipoElemento = 'VANO' and A.ARCH_Nombre not like '%SEA%' then replace(A.ARCH_Nombre,'/VANO/','/VANO/SEA')
						else 
							case 
								when A.ARCH_Nombre is null then ''
								else A.ARCH_Nombre
							end
					end,1,LEN(case 
						when A.ARCH_Nombre is not null and D.DEFI_TipoElemento = 'POST' and A.ARCH_Nombre not like '%SEA%' then replace(A.ARCH_Nombre,'/POST/','/POST/SEA')
						when A.ARCH_Nombre is not null and D.DEFI_TipoElemento = 'VANO' and A.ARCH_Nombre not like '%SEA%' then replace(A.ARCH_Nombre,'/VANO/','/VANO/SEA')
						else 
							case 
								when A.ARCH_Nombre is null then ''
								else A.ARCH_Nombre
							end
					end)-2) PhotosPath,SUBSTRING( A.ARCH_Nombre,1,LEN(A.ARCH_Nombre)-2) as OriginalPath

from Archivos A inner join Deficiencias D on D.DEFI_Interno = A.ARCH_CodTabla
join 
(
			select		'POST' TipoElemento,p.POST_Terceros terceros, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento,s.SED_Terceros, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento,v.VANO_Terceros, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
) as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento and el.terceros = 0 and ALIM_Interno = @feeder
and D.DEFI_Activo = 1
order by D.DEFI_FecRegistro desc
end
go
