update		d
set			d.DEFI_TipoElemento	=	'POST',
			d.DEFI_IdElemento	=	p.POST_Interno
from		Deficiencias	d
inner join	Postes			p	on	d.DEFI_Latitud	=	p.POST_Latitud
where		d.TABL_Interno = 2

update		d
set			d.DEFI_TipoElemento	=	'POST',
			d.DEFI_IdElemento	=	p.POST_Interno
from		Deficiencias	d
inner join
(
			select		p.POST_Interno,	p.POST_CodigoNodo,	a.ALIM_Codigo
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
)			as				p	on	concat('SEA',d.DEFI_CodigoElemento)		=	p.POST_CodigoNodo	and
									convert(int,d.DEFI_CodAMT)	=	convert(int,p.ALIM_Codigo)
where		d.TABL_Interno	=	2 and d.DEFI_IdElemento is null

update		d
set			d.DEFI_TipoElemento	=	'VANO',
			d.DEFI_IdElemento	=	v.VANO_Interno
from		Deficiencias	d
inner join
(
			select		v.VANO_Interno, a.ALIM_Codigo, v.VANO_Codigo
			from		Vanos			v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)			as				v	on	concat('SEA', d.DEFI_CodigoElemento)	=	v.VANO_Codigo	and
									d.DEFI_CodAMT							=	v.ALIM_Codigo
where		TABL_Interno = 3

update		d
set			d.DEFI_TipoElemento	= 'VANO',
			d.DEFI_IdElemento	= v.VANO_Interno
from		Deficiencias	d
inner join
(
			select		v.VANO_Interno, VANO_LatitudIni, vano_longitudini, vano_latitudFin, VANO_LongitudFin,
						(VANO_LatitudFin - VANO_LatitudIni) / 2 + VANO_LatitudIni	VANO_Latitud,
						(VANO_LongitudFin - VANO_LongitudIni) / 2 + VANO_LongitudIni VANO_Longitud
			from		Vanos		v
)			as				v	on	round(d.DEFI_Latitud, 4)	=	round(v.VANO_Latitud, 4) and
									round(d.DEFI_Longitud, 4)	=	round(v.VANO_Longitud, 4)
where		TABL_Interno = 3 and d.DEFI_IdElemento is null

update		d
set			d.DEFI_TipoElemento	=	'SED',
			d.DEFI_IdElemento	=	s.SED_Interno
from		Deficiencias	d
inner join
(
			select		s.SED_Interno,	s.SED_Etiqueta, a.ALIM_Codigo
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
)			as				s	on	d.DEFI_CodigoElemento		=	substring(s.SED_Etiqueta,1,4)	and
									d.DEFI_CodAMT				=	s.ALIM_Codigo
where		d.TABL_Interno = 1

update		d
set			d.DEFI_TipoElemento	=	'SED',
			d.DEFI_IdElemento	=	s.SED_Interno
from		Deficiencias	d
inner join	Seds			s	on	d.DEFI_Latitud	=	s.SED_Latitud	and
									d.DEFI_Longitud	=	s.SED_Longitud
where		d.TABL_Interno = 1 and d.DEFI_IdElemento is null