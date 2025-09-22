/*
Busca que ruta de carpeta que no coincide con estado de deficiencia
*/

select SubString(ar.ARCH_Nombre,1,LEN(ar.ARCH_Nombre)-2) Ruta, el.CodIns, d.DEFI_Estado, d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno
From Archivos ar
join Deficiencias d on d.DEFI_Interno = ar.ARCH_CodTabla and ar.ARCH_Tabla = 'Deficiencias'
join 
(
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento
where d.DEFI_Activo =1 and d.DEFI_Estado='O' and ARCH_Nombre like '%/Deficiencias%' and ALIM_Interno in(4,32,39,40,41,179)--ALIM_Interno
group by SubString(ar.ARCH_Nombre,1,LEN(ar.ARCH_Nombre)-2), d.DEFI_Estado, d.DEFI_TipoElemento, ALIM_Etiqueta, ALIM_Interno, el.CodIns
order by Ruta,CodIns

/*
Actualiza ruta correcta de carpeta no coincide con estado de deficiencia
*/
Update a
Set a.ARCH_Nombre = a2.Ruta
From Archivos as a
Join(
select ar.ARCH_Interno, Concat(Replace(substring(ar.arch_nombre, 1, CHARINDEX('/', ar.ARCH_Nombre, CHARINDEX('/', ar.ARCH_Nombre, CHARINDEX('/', ar.arch_nombre, CHARINDEX('/', ar.ARCH_Nombre) + 1) + 1) + 1) - 1),'Deficiencias/SED','Sin Deficiencias'),SUBSTRING(ar.ARCH_Nombre,LEN(ar.ARCH_Nombre)-1,LEN(ar.ARCH_Nombre))) Ruta, 
		el.CodIns, d.DEFI_Estado, d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno
From Archivos ar
join Deficiencias d on d.DEFI_Interno = ar.ARCH_CodTabla and ar.ARCH_Tabla = 'Deficiencias'
join 
(
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento
where d.DEFI_Activo =1 and d.DEFI_Estado='O' and ARCH_Nombre like '%/Deficiencias%' and ALIM_Interno in(4,32,39,40,41,179)---ALIM_Interno
group by ar.ARCH_Interno,Concat(Replace(substring(ar.arch_nombre, 1, CHARINDEX('/', ar.ARCH_Nombre, CHARINDEX('/', ar.ARCH_Nombre, CHARINDEX('/', ar.arch_nombre, CHARINDEX('/', ar.ARCH_Nombre) + 1) + 1) + 1) - 1),'Deficiencias/SED','Sin Deficiencias'),SUBSTRING(ar.ARCH_Nombre,LEN(ar.ARCH_Nombre)-1,LEN(ar.ARCH_Nombre))),
ALIM_Etiqueta, ALIM_Interno, el.CodIns, d.DEFI_Estado,d.DEFI_TipoElemento
) as a2 on a2.ARCH_Interno = a.ARCH_Interno
where a2.ARCH_Interno = a.ARCH_Interno