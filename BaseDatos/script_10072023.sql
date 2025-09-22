select		CodEmp,		CodDEF,		TipINS,						CodINS,	TipDEF,
			CodRES,		NroSUM,		CodDEN,						FecDEN,	FecINS, 
			'' FecSUB,	0 EstSUB,	d.DEFI_Comentario Observ,	Refer1,	Refer2,		
			CoordX,		CoordY,		CodAMT,						UsuCre,	UsuNPc,		
			FecReg,		NroORD
from		DeficienciasSeal	ds
inner join	
(
	select		c.CODI_Codigo, e.CodigoNodo, d.*
	from		Deficiencias	d
	inner join	Tipificaciones	t	on	d.tipi_interno	=	t.tipi_interno
	inner join	Codigos			c	on	t.CODI_Interno	=	c.CODI_Interno
	inner join	
	(
				select		'POST' Tipo, p.POST_Interno Interno, p.POST_CodigoNodo CodigoNodo
				from		Postes		p
				union all
				select		'SED' Tipo, s.SED_Interno Interno, s.SED_Codigo CodigoNodo
				from		Seds s
	)			as				e	on	d.DEFI_TipoElemento = e.Tipo and
										d.DEFI_IdElemento	= e.Interno
	where		DEFI_Estado = 'N' and DEFI_Activo = 1
)			as					d	on	ds.TipDEF		=	d.CODI_Codigo	and
										ds.CodINS		=	d.codigoNodo
where		ds.estsub = 2 and 
			ds.tipdef  in ('1002','1008','1012','1042','2082','2086','2002','2008','2004')
			and not d.CODI_Codigo is null and
			DATEFROMPARTS(
							SUBSTRING(ds.FecSUB, 7,4),
							SUBSTRING(ds.FecSUB, 4,2),
							SUBSTRING(ds.FecSUB, 1,2)) <= d.DEFI_FechaInspeccion

--5946
/*
2086	1223	2
2082	1654	2
2008	2669	2
2082	3040	2
2086	3288	2
2082	3289	2
2082	3631	2
2082	3652	2
2082	3758	2
*/

update	Deficiencias
set		DEFI_Activo = 0, DEFI_Comentario = 'Eliminado por duplicidad por mfoco'
where	DEFI_Interno = 55729