alter table Deficiencias add DEFI_FecRegistro datetime not null
alter table Deficiencias alter column DEFI_CodigoElemento varchar(50)
alter table Deficiencias add DEFI_CodDef varchar(20)
alter table Deficiencias add DEFI_CodRes int
alter table Deficiencias add DEFI_CodDen int
alter table Deficiencias add DEFI_Refer1 varchar(30)
alter table Deficiencias add DEFI_Refer2 varchar(30)
alter table Deficiencias add DEFI_CoordX float
alter table Deficiencias add DEFI_CoordY float
alter table Deficiencias add DEFI_CodAMT varchar(5)
alter table Deficiencias add DEFI_UsuCre varchar(50)
alter table Deficiencias add DEFI_UsuNPC varchar(50)
alter table Deficiencias add DEFI_NroOrden varchar(50)
alter table Deficiencias add DEFI_PointX float
alter table Deficiencias add DEFI_PointY float

insert into Tipificaciones
		(	TIPO_Descripcion, CODI_Interno)
values
		(	'OTROS', 1)

delete from Deficiencias
dbcc checkident ('deficiencias', reseed, 0)
		
insert into Deficiencias
		(	DEFI_Estado,			INSP_Interno,		TABL_Interno,			DEFI_CodigoElemento,
			TIPI_Interno,			DEFI_NumSuministro,	DEFI_FechaDenuncia,		DEFI_FechaInspeccion,
			DEFI_FechaSubsanacion,	DEFI_Observacion,	DEFI_EstadoSubsanacion,	DEFI_Latitud,
			DEFI_Longitud,			DEFI_TipoElemento,	DEFI_IdElemento,		DEFI_FecRegistro,
			DEFI_CodDef,			DEFI_CodRes,		DEFI_CodDen	,			DEFI_Refer1,
			DEFI_Refer2,			DEFI_CoordX,		DEFI_CoordY,			DEFI_CodAMT,
			DEFI_UsuCre,			DEFI_UsuNpc,		DEFI_NroOrden,			DEFI_PointX,
			DEFI_PointY)
select		'S',					null,				d.TipINS,				d.CodINS,
									isnull(t.TIPI_Interno, 43),					d.NroSUM,			
			case
				when FecDEN is null then null
				when CodDEF = '2021DEF00035' then DATEFROMPARTS(2021,6,2)
				else DATEFROMPARTS(
					SUBSTRING(FecDEN, 7,4),
					SUBSTRING(FecDEN, 4,2),
					SUBSTRING(FecDEN, 1,2)
				)
			end,
			case
				when d.FecINS is null then null
				when CodDEF = '2021DEF00035' then DATEFROMPARTS(2021,6,2)
				else DATEFROMPARTS(
					SUBSTRING(d.FecINS, 7,4),
					SUBSTRING(d.FecINS, 4,2),
					SUBSTRING(d.FecINS, 1,2)
				)
			end,
			case
				when d.FecSUB is null then null
				when CodDEF = '2021DEF00035' then DATEFROMPARTS(2022,8,6)
				else DATEFROMPARTS(
					SUBSTRING(d.FecSUB, 7,4),
					SUBSTRING(d.FecSUB, 4,2),
					SUBSTRING(d.FecSUB, 1,2)
				)
			end,				null,				d.EstSUB,				d.Latitud,
			d.Longitud,				null,				null,					GETDATE(),
			d.CodDEF,				d.CodRES,			d.CodDEN,				d.Refer1,
			d.Refer2,				d.CoordX,			d.CoordY,				d.CodAMT,
			d.UsuCre,				d.UsuNPc,			d.NroORD,				d.POINT_X,
			d.POINT_Y
from		master..Deficiencias_		d
left join
(
			select		c.CODI_Codigo, min(t.TIPI_Interno) TIPI_Interno
			from		Tipificaciones	t
			inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
			group by	c.CODI_Codigo
)			as							t	on	d.TipDEF		=	t.CODI_Codigo
