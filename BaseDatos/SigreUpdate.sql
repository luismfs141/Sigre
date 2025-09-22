update		d
set			d.DEFI_CodAMT = a.ALIM_Codigo
From		Deficiencias	as d
inner join	Postes			as p on d.DEFI_IdElemento	= p.POST_Interno
inner join	Alimentadores	as a on p.ALIM_Interno		= a.ALIM_Interno 
Where		DEFI_Estado <> 'S' and	d.DEFI_TipoElemento = 'POST'

update		d
set			d.DEFI_CodAMT = a.ALIM_Codigo
From		Deficiencias	as d
inner join	Seds			as p on d.DEFI_IdElemento	= p.SED_Interno
inner join	Alimentadores	as a on p.ALIM_Interno		= a.ALIM_Interno 
Where		DEFI_Estado <> 'S' and	d.DEFI_TipoElemento = 'SED'

update		d
set			d.DEFI_CodAMT = a.ALIM_Codigo
From		Deficiencias	as d
inner join	Vanos			as p on d.DEFI_IdElemento	= p.VANO_Interno
inner join	Alimentadores	as a on p.ALIM_Interno		= a.ALIM_Interno 
Where		DEFI_Estado <> 'S' and	d.DEFI_TipoElemento = 'VANO'