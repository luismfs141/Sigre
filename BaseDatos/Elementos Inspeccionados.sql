/*POSTES
*/

select ALIM_Etiqueta Alimentador,DEFI_TipoElemento Tipo, CodElemento, CodIns
From Archivos ar
join Deficiencias d on d.DEFI_Interno = ar.ARCH_CodTabla and ar.ARCH_Tabla = 'Deficiencias'
join 
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta, p.POST_Terceros
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno and POST_Terceros = 0
)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento
where d.DEFI_Activo =1 and ALIM_Interno = 38 and d.DEFI_TipoElemento = 'POST'
group by ALIM_Etiqueta,DEFI_TipoElemento, CodElemento, CodIns
order by ALIM_Etiqueta

/*SEDS
*/

select ALIM_Etiqueta Alimentador,DEFI_TipoElemento Tipo, CodElemento, CodIns
From Archivos ar
join Deficiencias d on d.DEFI_Interno = ar.ARCH_CodTabla and ar.ARCH_Tabla = 'Deficiencias'
join 
(
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta, s.SED_Terceros
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno and s.SED_Terceros = 0
)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento
where d.DEFI_Activo =1 and ALIM_Interno = 38 and d.DEFI_TipoElemento = 'SED'
group by ALIM_Etiqueta,DEFI_TipoElemento, CodElemento, CodIns
order by ALIM_Etiqueta	

/*Vanos
*/

select ALIM_Etiqueta Alimentador,DEFI_TipoElemento Tipo, CodElemento, CodIns
From Archivos ar
join Deficiencias d on d.DEFI_Interno = ar.ARCH_CodTabla and ar.ARCH_Tabla = 'Deficiencias'
join 
(
			select		'VANO' TipoElemento, v.VANO_Interno IdElemento, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno and v.VANO_Terceros = 0
)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento
where d.DEFI_Activo =1 and ALIM_Interno = 38 and d.DEFI_TipoElemento = 'VANO'
group by ALIM_Etiqueta,DEFI_TipoElemento, CodElemento, CodIns
order by ALIM_Etiqueta		