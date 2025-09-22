/*****************************************/
/****** ACTUALIZA FECHA INSPECCIÓN *******/
/*****************************************/
update		df
set			df.DEFI_FechaInspeccion = DATEFROMPARTS(
					SUBSTRING(ds.FecINS, 7,4),
					SUBSTRING(ds.FecINS, 4,2),
					SUBSTRING(ds.FecINS, 1,2)
			)
from		DeficienciasSeal	ds
inner join	Deficiencias		df	on	ds.CodDEF	=	df.DEFI_CodDef

/*****************************************/
/******** SUBSANADAS EN PORTALES ***********/
/*****************************************/
update		df
set			df.DEFI_FechaSubsanacion = '2023-05-6'
from		DeficienciasSeal	ds
inner join	Deficiencias		df	on	ds.CodDEF	=	df.DEFI_CodDef
inner join	Alimentadores		a	on	df.DEFI_CodAMT	=	a.ALIM_Codigo
where		ds.EstSUB = 0 and df.DEFI_EstadoSubsanacion in (1,2) and a.ALIM_Etiqueta in ('portales')

update		d
set			d.defi_fechaDenuncia = '2023-05-6', d.DEFI_FechaInspeccion = '2023-05-6'
from		Deficiencias	d
inner join	Alimentadores	a	on	d.defi_CodAmt	=	a.ALIM_Codigo
where		d.defi_estado = 'N' and a.ALIM_Etiqueta = 'portales' and d.defi_activo = 1


/*****************************************/
/******** SUBSANADAS EN ALTO LIBERTAD ***********/
/*****************************************/
update		df
set			df.DEFI_FechaSubsanacion = '2023-05-8'
from		DeficienciasSeal	ds
inner join	Deficiencias		df	on	ds.CodDEF	=	df.DEFI_CodDef
inner join	Alimentadores		a	on	df.DEFI_CodAMT	=	a.ALIM_Codigo
where		ds.EstSUB = 0 and df.DEFI_EstadoSubsanacion in (1,2) and a.ALIM_Etiqueta in ('alto libertad')

update		d
set			d.defi_fechaDenuncia = '2023-05-8', d.DEFI_FechaInspeccion = '2023-05-8'
from		Deficiencias	d
inner join	Alimentadores	a	on	d.defi_CodAmt	=	a.ALIM_Codigo
where		d.defi_estado = 'N' and a.ALIM_Etiqueta = 'alto libertad' and d.defi_activo = 1
/*****************************************/
/******** CORPAC ***********/
/*****************************************/
update		df
set			df.DEFI_FechaSubsanacion = '2023-05-9'
from		DeficienciasSeal	ds
inner join	Deficiencias		df	on	ds.CodDEF	=	df.DEFI_CodDef
inner join	Alimentadores		a	on	df.DEFI_CodAMT	=	a.ALIM_Codigo
where		ds.EstSUB = 0 and df.DEFI_EstadoSubsanacion in (1,2) and a.ALIM_Etiqueta in ('CORPAC')

update		d
set			d.defi_fechaDenuncia = '2023-05-9', d.DEFI_FechaInspeccion = '2023-05-9'
from		Deficiencias	d
inner join	Alimentadores	a	on	d.defi_CodAmt	=	a.ALIM_Codigo
where		d.defi_estado = 'N' and a.ALIM_Etiqueta = 'CORPAC' and d.defi_activo = 1
/*****************************************/
/******** MARIANO MELGAR ***********/
/*****************************************/
update		df
set			df.DEFI_FechaSubsanacion = '2023-05-10'
from		DeficienciasSeal	ds
inner join	Deficiencias		df	on	ds.CodDEF	=	df.DEFI_CodDef
inner join	Alimentadores		a	on	df.DEFI_CodAMT	=	a.ALIM_Codigo
where		ds.EstSUB = 0 and df.DEFI_EstadoSubsanacion in (1,2) and a.ALIM_Etiqueta in ('mariano melgar')

update		d
set			d.defi_fechaDenuncia = '2023-05-10', d.DEFI_FechaInspeccion = '2023-05-10'
from		Deficiencias	d
inner join	Alimentadores	a	on	d.defi_CodAmt	=	a.ALIM_Codigo
where		d.defi_estado = 'N' and a.ALIM_Etiqueta = 'mariano melgar' and d.defi_activo = 1
/*****************************************/
/******** PORONGOCHE ***********/
/*****************************************/
update		df
set			df.DEFI_FechaSubsanacion = '2023-05-11'
from		DeficienciasSeal	ds
inner join	Deficiencias		df	on	ds.CodDEF	=	df.DEFI_CodDef
inner join	Alimentadores		a	on	df.DEFI_CodAMT	=	a.ALIM_Codigo
where		ds.EstSUB = 0 and df.DEFI_EstadoSubsanacion in (1,2) and a.ALIM_Etiqueta in ('porongoche')

update		d
set			d.defi_fechaDenuncia = '2023-05-11', d.DEFI_FechaInspeccion = '2023-05-11'
from		Deficiencias	d
inner join	Alimentadores	a	on	d.defi_CodAmt	=	a.ALIM_Codigo
where		d.defi_estado = 'N' and a.ALIM_Etiqueta = 'porongoche' and d.defi_activo = 1
/*****************************************/
/******** JORGE CHAVEZ ***********/
/*****************************************/
update		df
set			df.DEFI_FechaSubsanacion = '2023-05-12'
from		DeficienciasSeal	ds
inner join	Deficiencias		df	on	ds.CodDEF	=	df.DEFI_CodDef
inner join	Alimentadores		a	on	df.DEFI_CodAMT	=	a.ALIM_Codigo
where		ds.EstSUB = 0 and df.DEFI_EstadoSubsanacion in (1,2) and a.ALIM_Etiqueta in ('jorge chavez')

update		d
set			d.defi_fechaDenuncia = '2023-05-12', d.DEFI_FechaInspeccion = '2023-05-12'
from		Deficiencias	d
inner join	Alimentadores	a	on	d.defi_CodAmt	=	a.ALIM_Codigo
where		d.defi_estado = 'N' and a.ALIM_Etiqueta = 'jorge chavez' and d.defi_activo = 1
/*****************************************/
/******** DEFICIENCIAS 2104 DESACTIVADAS ***********/
/*****************************************/
update		d
set			d.DEFI_Activo = 0
from		Deficiencias	d
inner join	tipificaciones	t	on	d.tipi_interno	=	t.tipi_Interno
inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
where		c.CODI_Codigo = 2104 and d.DEFI_Estado = 'N'