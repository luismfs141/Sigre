/******************************/
/************ POSTES **********/--173
/******************************/

CREATE or Alter Procedure [dbo].[sp_GetPostsByFeeder]
	@Feeder int
AS
Begin
select		CONVERT(int ,row_number() OVER(Order By p.POST_Interno)) StructId, a.ALIM_Codigo FeederCode, a.ALIM_Etiqueta FeederLabel, p.POST_Interno ElementId, 'POST' ElementType, p.POST_CodigoNodo CodIns, p.POST_Etiqueta Label, 
			isnull(d.tipiCode,'') TypificationCode, '' SedType, '' StartNode, '' EndNode, isnull(d.DEFI_TipoMaterial,'') ElementMaterial,isnull(d.DEFI_TipoRetenida,'') HeldType, isnull(d.DEFI_NumSuministro,'') Supply,
					isnull(d.DEFI_DistHorizontal,0) DistHorizontal, isnull(d.DEFI_DistVertical,0) DistVertical, isnull(d.DEFI_ArmadoMaterial,'') ArmedMaterial, isnull(d.DEFI_TipoArmado,'') ArmedType, CONCAT(isnull(d.DEFI_Estado,''),isnull(d.DEFI_EstadoSubsanacion,''))  Subsanacion,
					isnull(d.DEFI_NumPostes,0) PostNum, isnull(f.Cantidad,0) PhotosQuantity,isnull(d.DEFI_EstadoCriticidad,'')ElementCritical,case 
																								when f.Ruta is not null and f.Ruta not like '%SEA%' then replace(ruta,'/POST/','/POST/SEA')
																								else 
																									case 
																										when f.Ruta is null then ''
																										else f.Ruta
																									end
																							end PhotosPath --isnull(f.Ruta,'') PhotosPath
					
from		Postes			p
inner join	Alimentadores	a	on	p.ALIM_Interno	=	a.ALIM_Interno
left join	
(
			select	(select c.CODI_Codigo
					from Tipificaciones t
					inner join Codigos c on c.CODI_Interno = t.CODI_Interno
					where t.TIPI_Interno = d.TIPI_Interno) tipiCode, d.DEFI_Interno, d.DEFI_IdElemento, d.DEFI_TipoMaterial,d.DEFI_TipoRetenida,d.DEFI_NumSuministro,
					d.DEFI_DistHorizontal, d.DEFI_DistVertical, d.DEFI_ArmadoMaterial, d.DEFI_TipoArmado, d.DEFI_EstadoSubsanacion, d.DEFI_NumPostes, d.DEFI_Estado,d.DEFI_EstadoCriticidad
			from	Deficiencias	d
			where	d.DEFI_TipoElemento = 'POST' and d.DEFI_Activo = 1	and
					not (d.DEFI_FecModificacion is null and d.DEFI_Estado = 'S' and d.DEFI_EstadoSubsanacion = 2)
)			as				d	on	p.POST_Interno	=	d.DEFI_IdElemento
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						count(distinct SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre))) Cantidad,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)			as				f	on d.DEFI_Interno = f.ARCH_CodTabla
where		a.ALIM_Interno = @Feeder and p.POST_Terceros <> 1
order by	ElementId,PhotosPath 
END
Go

/******************************/
/************* SEDS ***********/
/******************************/

CREATE or Alter Procedure [dbo].[sp_GetSedsByFeeder]
	@Feeder int
As
Begin
select		CONVERT(int ,row_number() OVER(Order By s.SED_Interno)) StructId,a.ALIM_Codigo FeederCode,a.ALIM_Etiqueta FeederLabel, s.SED_Interno ElementId, 'SED' ElementType, s.SED_Codigo CodIns, s.SED_Etiqueta Label, 
			isnull(d.tipiCode,'') TypificationCode, s.SED_Tipo SedType, '' StartNode, '' EndNode, isnull(f.Ruta,'') PhotosPath, isnull(d.DEFI_TipoMaterial,'') ElementMaterial,isnull(d.DEFI_TipoRetenida,'') HeldType, isnull(d.DEFI_NumSuministro,'') Supply,
					isnull(d.DEFI_DistHorizontal,0) DistHorizontal, isnull(d.DEFI_DistVertical,0) DistVertical, isnull(d.DEFI_ArmadoMaterial,'') ArmedMaterial, isnull(d.DEFI_TipoArmado,'') ArmedType, CONCAT(isnull(d.DEFI_Estado,''),isnull(d.DEFI_EstadoSubsanacion,'')) Subsanacion,
					isnull(d.DEFI_NumPostes,0) PostNum, isnull(f.Cantidad,0) PhotosQuantity,isnull(d.DEFI_EstadoCriticidad,'')ElementCritical
from	    Seds			s
inner join	Alimentadores	a	on	s.ALIM_Interno	=	a.ALIM_Interno
left join	
(
			select		(select c.CODI_Codigo
					from Tipificaciones t
					inner join Codigos c on c.CODI_Interno = t.CODI_Interno
					where t.TIPI_Interno = d.TIPI_Interno) tipiCode,	d.DEFI_Interno, d.DEFI_IdElemento, d.DEFI_TipoMaterial,d.DEFI_TipoRetenida,d.DEFI_NumSuministro,
					d.DEFI_DistHorizontal, d.DEFI_DistVertical, d.DEFI_ArmadoMaterial, d.DEFI_TipoArmado, d.DEFI_EstadoSubsanacion, d.DEFI_NumPostes, d.DEFI_Estado,d.DEFI_EstadoCriticidad
			from		Deficiencias	d
			where	d.DEFI_TipoElemento = 'SED' and d.DEFI_Activo = 1	and
					not (d.DEFI_FecModificacion is null and d.DEFI_Estado = 'S' and d.DEFI_EstadoSubsanacion = 2)
)			as				d	on	s.SED_Interno	=	d.DEFI_IdElemento
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						count(distinct SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre))) Cantidad,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)			as				f	on d.DEFI_Interno = f.ARCH_CodTabla
where		a.ALIM_Interno = @Feeder and s.SED_Terceros <> 1
order by	ElementId, PhotosPath 
End
Go

/******************************/
/************ VANOS ***********/
/******************************/

CREATE or Alter Procedure  [dbo].[sp_GetGapsByFeeder]
	@Feeder int
As
Begin
select		CONVERT(int ,row_number() OVER(Order By v.VANO_Interno)) StructId,a.ALIM_Codigo FeederCode,a.ALIM_Etiqueta FeederLabel, v.VANO_Interno ElementId, 'VANO' ElementType, v.VANO_Codigo CodIns, v.VANO_Etiqueta Label, 
			Isnull(d.tipiCode,'') TypificationCode, '' SedType, isnull(d.DEFI_NodoInicial,'') StartNode, isnull(d.DEFI_NodoFinal,'') EndNode, isnull(d.DEFI_TipoMaterial,'') ElementMaterial,isnull(d.DEFI_TipoRetenida,'') HeldType, isnull(d.DEFI_NumSuministro,'') Supply,
					isnull(d.DEFI_DistHorizontal,0) DistHorizontal, isnull(d.DEFI_DistVertical,0) DistVertical, isnull(d.DEFI_ArmadoMaterial,'') ArmedMaterial, isnull(d.DEFI_TipoArmado,'') ArmedType, CONCAT(isnull(d.DEFI_Estado,''),isnull(d.DEFI_EstadoSubsanacion,'')) Subsanacion,
					isnull(d.DEFI_NumPostes,0) PostNum, isnull(f.Cantidad,0) PhotosQuantity,isnull(d.DEFI_EstadoCriticidad,'')ElementCritical, case 
																								when f.Ruta is not null and f.Ruta not like '%SEA%' then replace(ruta,'/VANO/','/VANO/SEA')
																								else 
																									case 
																										when f.Ruta is null then ''
																										else f.Ruta
																									end
																							end PhotosPath--isnull(f.Ruta,'') PhotosPath
from		Vanos			v
inner join	Alimentadores	a	on	v.ALIM_Interno	=	a.ALIM_Interno
left join	
(
			select	(select c.CODI_Codigo
					from Tipificaciones t
					inner join Codigos c on c.CODI_Interno = t.CODI_Interno
					where t.TIPI_Interno = d.TIPI_Interno) tipiCode, d.DEFI_Interno, d.DEFI_IdElemento, d.DEFI_NodoInicial, d.DEFI_NodoFinal, d.DEFI_TipoMaterial,d.DEFI_TipoRetenida,d.DEFI_NumSuministro,
					d.DEFI_DistHorizontal, d.DEFI_DistVertical, d.DEFI_ArmadoMaterial, d.DEFI_TipoArmado, d.DEFI_EstadoSubsanacion, d.DEFI_NumPostes, d.DEFI_Estado,d.DEFI_EstadoCriticidad
			from	Deficiencias	d
			where	d.DEFI_TipoElemento = 'VANO' and d.DEFI_Activo = 1	and
					not (d.DEFI_FecModificacion is null and d.DEFI_Estado = 'S' and d.DEFI_EstadoSubsanacion = 2)
)			as				d	on	v.VANO_Interno	=	d.DEFI_IdElemento
left Join	
(
			select		ARCH_Tabla, ARCH_CodTabla,
						count(distinct SUBSTRING(ARCH_Nombre, LEN(ARCH_Nombre) -  CHARINDEX('/',REVERSE(ARCH_Nombre)) + 2, LEN(ARCH_Nombre))) Cantidad,
						MAX(
						SUBSTRING(a.ARCH_Nombre,1,LEN(a.ARCH_Nombre)-2)) Ruta
			from		Archivos As a 
			Where		ARCH_Tabla ='Deficiencias' 
			Group by	ARCH_Tabla, ARCH_CodTabla
)			as				f	on d.DEFI_Interno = f.ARCH_CodTabla
where		a.ALIM_Interno = @Feeder and v.VANO_Terceros <> 1
order by	ElementId, PhotosPath 
End
Go