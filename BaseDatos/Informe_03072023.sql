select		CodEmp,
CodDEF,
TipINS,
CodINS,
TipDEF,
CodRES,
NroSUM,
CodDEN,
FecDEN,
FecINS,
FecSUB,
EstSub,
case TipDEF
	when '2082' then d.DEFI_EstadoSubsanacion
	when '2086' then d.DEFI_EstadoSubsanacion
	else EstSUB
end EstSub,
Observ,
Refer1,
Refer2,
CoordX,
CoordY,
CodAMT,
UsuCre,
UsuNPc,
FecReg,
NroORD,
'M' Modificado
--select		d.*
from		DeficienciasSeal	ds
inner join	Deficiencias		d	on	ds.CodDEF	=	d.DEFI_CodDef
where		ds.CodAMT in 
(	'502', '506', '505', '701', '705', '704', '702', '703', '707', '501', '503', '504', '303',
	'305', '306', '307', '301', '302') and
	ds.CodINS = '2501' and ds.TipDEF in ('2082','2086') and
	d.DEFI_Activo = 1


select		*
from		Deficiencias	d
inner join	Archivos		a	on	d.DEFI_Interno	=	a.ARCH_CodTabla	and
									'Deficiencias'	=	a.ARCH_Tabla
where		DEFI_CodDef = '2010DEF03686'

select top 100 * from Archivos