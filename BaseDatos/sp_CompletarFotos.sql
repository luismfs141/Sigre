Create or Alter procedure sp_ArchivosIncompletosLista
@Feeder int
As
Begin
Select a.ARCH_CodTabla Codigo,SUBSTRING(REPLACE(a.ARCH_Nombre,'/000','/SEA000'),1,LEN(REPLACE(a.ARCH_Nombre,'/000','/SEA000'))-2) Ruta, count(a.ARCH_CodTabla) NroFotos--149
From Deficiencias as d
join Archivos as a on a.ARCH_CodTabla = d.DEFI_Interno
join 
(
			select		'POST' TipoElemento, p.POST_Interno IdElemento, p.POST_CodigoNodo CodIns, p.POST_Etiqueta CodElemento,
						p.ALIM_Interno, a.ALIM_Etiqueta
			from		Postes			p
			inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
			union all	
			select		'SED' TipoElemento, s.SED_Interno IdElemento, s.SED_Codigo CodIns, s.SED_Etiqueta CodElemento,
						s.ALIM_Interno, a.ALIM_Etiqueta
			from		Seds			s
			inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
			union all
			select		'VANO' TipoElemento, v.VANO_Interno, v.VANO_Codigo CodIns, v.VANO_Etiqueta CodElemento,
						v.ALIM_Interno, a.ALIM_Etiqueta
			from		Vanos	v
			inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
)	as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento and ALIM_Interno = @Feeder
where d.DEFI_Activo = 1 and d.DEFI_Estado <> 'O'
Group by SUBSTRING(REPLACE(a.ARCH_Nombre,'/000','/SEA000'),1,LEN(REPLACE(a.ARCH_Nombre,'/000','/SEA000'))-2), a.ARCH_CodTabla
Having count(a.ARCH_CodTabla) < 4
Order By Ruta
End