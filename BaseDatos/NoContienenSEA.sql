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