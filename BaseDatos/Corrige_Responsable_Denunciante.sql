/**********************/
/***** TERCEROS *******/
/**********************/
update		d
set			d.DEFI_Responsable = 1
from		Deficiencias		d
inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
inner Join	
(
			Select	a.ARCH_CodTabla, SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2) Ruta
			From	Archivos a
			where	a.ARCH_Tabla = 'Deficiencias'
			group by SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2), a.ARCH_CodTabla
)							AS arc	on d.DEFI_Interno = arc.ARCH_CodTabla
where		c.CODI_Codigo in (5018, 5016, 1036, 2026) and d.DEFI_Responsable = 0 

/*********************************/
/******** CONCESIONARIA **********/
/*********************************/
update		d
set			d.DEFI_Responsable = 0
from		Deficiencias		d
inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
inner Join	
(
			Select	a.ARCH_CodTabla, SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2) Ruta
			From	Archivos a
			where	a.ARCH_Tabla = 'Deficiencias'
			group by SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2), a.ARCH_CodTabla
)							AS arc	on d.DEFI_Interno = arc.ARCH_CodTabla
where		c.CODI_Codigo in (1002, 1008, 1012, 1042, 1072, 1074, 1082, 2002, 2004, 2008, 2034, 2132, 2040, 2072, 2074, 2082, 2086,
			5010, 5030, 5032) and d.DEFI_Responsable = 1

/*********************************/
/******** CONCESIONARIA **********/
/*********************************/
update		d
set			d.DEFI_CodDen = 1
from		Deficiencias	d
inner join	Tipificaciones	t	on	d.TIPI_Interno	=	t.TIPI_Interno
inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
inner Join	
(
			Select	a.ARCH_CodTabla, SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2) Ruta
			From	Archivos a
			where	a.ARCH_Tabla = 'Deficiencias'
			group by SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2), a.ARCH_CodTabla
)							AS arc	on d.DEFI_Interno = arc.ARCH_CodTabla
where		d.DEFI_CodDen is null or d.DEFI_CodDen = 0