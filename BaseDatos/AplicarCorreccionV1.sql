-- Borra el espacio de las rutas de SED
update Archivos
set ARCH_Nombre = REPLACE(ARCH_nombre,' /','/')

--Añade los alimentadores a la ruta de las deficiencias Iniciales
delete Archivos
where ARCH_Interno in (8,9,10,25,26,107,108,109,1560,1562,1565,3249,3251)

Update a 
set a.ARCH_Nombre = CONCAT(OldArchivos.ALIM_Etiqueta,'/',OldArchivos.ARCH_Nombre)
From Archivos as a
right join
					(
					select ar.ARCH_Interno, ALIM_Etiqueta, ar.ARCH_Nombre
					From Archivos ar
					join Deficiencias d on d.DEFI_Interno = ar.ARCH_CodTabla and ar.ARCH_Tabla = 'Deficiencias'
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
					)			as	el on d.DEFI_IdElemento = el.IdElemento and d.DEFI_TipoElemento = el.TipoElemento
					where ar.ARCH_Nombre like 'Sin Def%' or ar.ARCH_Nombre like 'Defi%'
					) as OldArchivos on OldArchivos.ARCH_Interno = a.ARCH_Interno
where a.ARCH_Interno in (OldArchivos.ARCH_Interno)


/*
Añade codigo AMT a las deficiencias que no tienen
*/

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


/*
Corrige las Sin Deficiencia con tipificacion
*/
Update Deficiencias
Set TIPI_Interno = NULL
WHERE DEFI_Interno in (Select DEFI_Interno from Deficiencias
						Where DEFI_Estado = 'O'
						And TIPI_Interno	= 31)

-- Asigna un estado de criticidad a un deficiencia que no tiene
Update Deficiencias
set DEFI_EstadoCriticidad = 2
Where TIPI_Interno is not null and DEFI_EstadoCriticidad is null and TIPI_Interno in (4,18,38,36,42)

Update Deficiencias
set DEFI_EstadoCriticidad = 1
where TIPI_Interno is not null and DEFI_EstadoCriticidad is null

-- Quitar Espacio SED

update Archivos 
set ARCH_Nombre = REPLACE(ARCH_Nombre , 'SED /', 'SED/')


-- Actualizar SED_Terceros a 1 de los que contengan P (Privado) y C (Caseta)

update Seds set SED_Terceros = 1
where SED_Etiqueta like '%P%'