select d.DEFI_Estado,d.DEFI_EstadoSubsanacion , c.CODI_Codigo, d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno, Count(CODI_Codigo)--45122
From Deficiencias d 
join 
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno and p.POST_Terceros = 0
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno and s.SED_Terceros = 0
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno and v.VANO_Terceros = 0
)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento 
left join Tipificaciones t on t.TIPI_Interno =d.TIPI_Interno
left join Codigos c on c.CODI_Interno = t.CODI_Interno
where d.DEFI_Activo = 1 and d.DEFI_Estado <> 'O' and ALIM_Interno = 138
Group by d.DEFI_Estado, c.CODI_Codigo, d.DEFI_TipoElemento, ALIM_Etiqueta,ALIM_Interno,d.DEFI_EstadoSubsanacion
order by CODI_Codigo