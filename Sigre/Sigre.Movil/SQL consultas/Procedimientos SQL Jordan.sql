create   PROCEDURE [dbo].[sp_ListarPostesYVanosPorSed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- POSTES
    SELECT  
        t.POST_Interno        AS Interno,
        t.POST_CodigoNodo     AS Codigo,
        t.SED_Codigo          AS SedCodigo,
        t.POST_Inspeccionado  AS Inspeccinado,
        'Poste'               AS Tipo
    FROM (
        SELECT p.*, s.SED_Codigo
        FROM Postes p
        INNER JOIN Seds s 
            ON s.SED_Interno = p.POST_Subestacion
    ) AS t
    WHERE t.SED_Codigo = @SED_Codigo and t.POST_Terceros = 0

    UNION ALL

    -- VANOS
    SELECT  
        t.VANO_Interno        AS Interno,
        t.VANO_Codigo         AS Codigo,
        t.SED_Codigo          AS SedCodigo,
        t.VANO_Inspeccionado  AS Inspeccinado,
        'Vano'                AS Tipo
    FROM (
        SELECT v.*, s.SED_Codigo
        FROM Vanos v
        INNER JOIN Seds s 
            ON s.SED_Interno = v.VANO_Subestacion
    ) AS t
    WHERE t.SED_Codigo = @SED_Codigo and t.VANO_Terceros = 0
END;


create PROCEDURE [dbo].[sp_GetListLatLongPOSTbySed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.POST_Etiqueta       AS Etiqueta,
        t.POST_CodigoNodo     AS Codigo,
        t.POST_Latitud        AS Latitud,
        t.POST_Longitud       AS Longitud,
        t.POST_Terceros       AS Terceros,
        t.POST_Inspeccionado  AS Inspeccinado,
        'Poste'               AS Tipo
    FROM (
        SELECT p.*, s.SED_Codigo
        FROM Postes p
        INNER JOIN Seds s 
            ON s.SED_Interno = p.POST_Subestacion
    ) AS t
    WHERE t.SED_Codigo = @SED_Codigo and t.POST_Terceros = 0;
END;

create PROCEDURE [dbo].[sp_GetListLatLongVANOSbySed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    select 
t.VANO_Codigo as Codigo,
t.VANO_LatitudIni,
t.VANO_LongitudIni,
t.VANO_LatitudFin,
t.VANO_LongitudFin,
t.VANO_Terceros as Terceros,
t.VANO_Inspeccionado as Inspeccinado, 
'Vano' as Tipo 
from (
select V.* , s.SED_Codigo from Vanos V
inner join Seds s on s.SED_Interno = V.VANO_Subestacion
) as t
where t.SED_Codigo = @SED_Codigo and t.VANO_Terceros = 0
END;



create Procedure [dbo].[sp_GetReportGapsByFeeder]
@feeder int
As Begin
Select 
	TD.ALIM_Etiqueta,
	TD.Fecha,
	va.VANO_Codigo,
	TD.NodoInicial,
	TD.NodoFinal,
	TD.[7002],
	TD.[7004],
	TD.[7006],
	TD.[7008],
	TD.Criticidad,
	TD.Ruta,
	TD.S0,
	TD.S1,
	TD.S2,
	TD.N
From Vanos as va
left join(
Select --198
		V.VANO_Interno,
		V.ALIM_Interno,
		V.VANO_Codigo,
		MAX(V.VANO_NodoInicial) NodoInicial,
		MAX(V.VANO_NodoFinal) NodoFinal,
		Al.ALIM_Etiqueta,
		MAX(CONVERT(varchar,isnull(D.DEFI_FecModificacion,D.DEFI_FecRegistro),103)) Fecha,
		MAX(IIF(C.CODI_Codigo = '7002','Sí','No')) [7002],
		MAX(IIF(C.CODI_Codigo = '7004','Sí','No')) [7004],
		MAX(IIF(C.CODI_Codigo = '7006','Sí','No')) [7006],
		MAX(IIF(C.CODI_Codigo = '7008','Sí','No')) [7008],
		MAX(Isnull(D.DEFI_EstadoCriticidad,0)) Criticidad,
		MIN(substring(a.arch_nombre, 1, CHARINDEX(V.VANO_Etiqueta+'/', a.ARCH_Nombre)+(LEN(V.VANO_Etiqueta)-1))) Ruta,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'VANO' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =0 and
										DEFI_FecModificacion is not null) S0,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_Estado ='S' and
										DEFI_TipoElemento = 'VANO' and
										DEFI_EstadoSubsanacion = 1 and
										DEFI_FecModificacion is not null) S1,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'VANO' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =2 and
										DEFI_FecModificacion is not null)S2,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_TipoElemento = 'VANO' and
										DEFI_Activo = 1 and
										DEFI_Estado ='N')N
from Vanos as V
left join Deficiencias as D on D.DEFI_IdElemento = V.VANO_Interno and D.DEFI_TipoElemento = 'VANO'
left join Archivos as A on A.ARCH_CodTabla = D.DEFI_Interno
left join Tipificaciones as T on T.TIPI_Interno = D.TIPI_Interno
left join Codigos as C on C.CODI_Interno = T.CODI_Interno
left join Alimentadores as Al on Al.ALIM_Interno = V.ALIM_Interno
Where
not (D.DEFI_Estado = 'S' and D.DEFI_FecModificacion is null)
and V.ALIM_Interno = @Feeder
and D.DEFI_Activo = 1
Group by V.VANO_Codigo, D.DEFI_IdElemento, V.VANO_Interno, V.ALIM_Interno, Al.ALIM_Etiqueta
) as TD on TD.VANO_Interno = va.VANO_Interno
Where va.ALIM_Interno = @Feeder
and va.VANO_Terceros = 0
Order By TD.VANO_Codigo desc
End

create Procedure [dbo].[sp_GetReportGapsVBTByFeeder]
@feeder int
As Begin
Select 
	TD.ALIM_Etiqueta,
	TD.Fecha,
	va.VANO_Codigo,
	TD.NodoInicial,
	TD.NodoFinal,
	TD.[7002],
	TD.[7004],
	TD.[7006],
	TD.[7008],
	TD.Criticidad,
	TD.Ruta,
	TD.S0,
	TD.S1,
	TD.S2,
	TD.N
From Vanos as va
left join(
Select --198
		V.VANO_Interno,
		V.ALIM_Interno,
		V.VANO_Codigo,
		MAX(V.VANO_NodoInicial) NodoInicial,
		MAX(V.VANO_NodoFinal) NodoFinal,
		Al.ALIM_Etiqueta,
		MAX(CONVERT(varchar,isnull(D.DEFI_FecModificacion,D.DEFI_FecRegistro),103)) Fecha,
		MAX(IIF(C.CODI_Codigo = '7002','Sí','No')) [7002],
		MAX(IIF(C.CODI_Codigo = '7004','Sí','No')) [7004],
		MAX(IIF(C.CODI_Codigo = '7006','Sí','No')) [7006],
		MAX(IIF(C.CODI_Codigo = '7008','Sí','No')) [7008],
		MAX(Isnull(D.DEFI_EstadoCriticidad,0)) Criticidad,
		'Ruta/.../.../...' Ruta,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'VANO' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =0 and
										DEFI_FecModificacion is not null) S0,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_Estado ='S' and
										DEFI_TipoElemento = 'VANO' and
										DEFI_EstadoSubsanacion = 1 and
										DEFI_FecModificacion is not null) S1,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'VANO' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =2 and
										DEFI_FecModificacion is not null)S2,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_TipoElemento = 'VANO' and
										DEFI_Activo = 1 and
										DEFI_Estado ='N')N
from Vanos as V
left join Deficiencias as D on D.DEFI_IdElemento = V.VANO_Interno and D.DEFI_TipoElemento = 'VANO'
left join Archivos as A on A.ARCH_CodTabla = D.DEFI_Interno
left join Tipificaciones as T on T.TIPI_Interno = D.TIPI_Interno
left join Codigos as C on C.CODI_Interno = T.CODI_Interno
left join Alimentadores as Al on Al.ALIM_Interno = V.ALIM_Interno
Where
-- not (D.DEFI_Estado = 'S' and D.DEFI_FecModificacion is null)
-- and V.ALIM_Interno = @Feeder
-- and D.DEFI_Activo = 1
V.VANO_Subestacion = @Feeder
Group by V.VANO_Codigo, D.DEFI_IdElemento, V.VANO_Interno, V.ALIM_Interno, Al.ALIM_Etiqueta
) as TD on TD.VANO_Interno = va.VANO_Interno
Where va.VANO_Subestacion = @Feeder
and va.VANO_Terceros = 0 and ALIM_Etiqueta is not null
Order By TD.VANO_Codigo desc
End



create Procedure [dbo].[sp_GetReportPostsBTByFeeder]
@Feeder int
as 
Begin
Select 
	TD.ALIM_Etiqueta,
	TD.Fecha,
	po.POST_CodigoNodo,
	po.POST_Etiqueta,
	TD.TipoArmado,
	TD.ArmadoMaterial,
	TD.NEMA,
	TD.[6002],
	TD.[6004],
	TD.[6006],
	TD.[6008],
	TD.[6024],
	TD.[6026],
	TD.[6028],
	TD.Criticidad,
	TD.Ruta,
	TD.S0,
	TD.S1,
	TD.S2,
	TD.N
From Postes as po
left join(
Select --198
		P.POST_Interno,
		P.ALIM_Interno,
		P.POST_CodigoNodo,
		P.POST_Etiqueta,
		Al.ALIM_Etiqueta,
		MAX(CONVERT(varchar,isnull(D.DEFI_FecModificacion,D.DEFI_FecRegistro),103)) Fecha,
		MAX(D.DEFI_TipoArmado) TipoArmado,
		MAX(D.DEFI_ArmadoMaterial) ArmadoMaterial,
		'1C13' NEMA,
		MAX(IIF(C.CODI_Codigo = '6002','Sí','No')) [6002],
		MAX(IIF(C.CODI_Codigo = '6004','Sí','No')) [6004],
		MAX(IIF(C.CODI_Codigo = '6006','Sí','No')) [6006],
		MAX(IIF(C.CODI_Codigo = '6008','Sí','No')) [6008],
		MAX(IIF(C.CODI_Codigo = '6024','Sí','No')) [6024],
		MAX(IIF(C.CODI_Codigo = '6026','Sí','No')) [6026],
		MAX(IIF(C.CODI_Codigo = '6028','Sí','No')) [6028],
		MAX(Isnull(D.DEFI_EstadoCriticidad,0)) Criticidad,
		'Ruta/.../.../...' Ruta,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'POST' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =0 and
										DEFI_FecModificacion is not null) S0,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_Estado ='S' and
										DEFI_TipoElemento = 'POST' and
										DEFI_EstadoSubsanacion = 1 and
										DEFI_FecModificacion is not null) S1,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'POST' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =2 and
										DEFI_FecModificacion is not null)S2,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_TipoElemento = 'POST' and
										DEFI_Activo = 1 and
										DEFI_Estado ='N')N
from Postes as P 
left join Deficiencias as D on D.DEFI_IdElemento = P.POST_Interno and D.DEFI_TipoElemento = 'POST'
left join Archivos as A on A.ARCH_CodTabla = D.DEFI_Interno
left join Tipificaciones as T on T.TIPI_Interno = D.TIPI_Interno
left join Codigos as C on C.CODI_Interno = T.CODI_Interno
left join Alimentadores as Al on Al.ALIM_Interno = P.ALIM_Interno
Where
-- not (D.DEFI_Estado = 'S' and D.DEFI_FecModificacion is null)
-- and p.ALIM_Interno = @Feeder
-- and D.DEFI_Activo = 1
P.POST_CodigoNodo like 'PTO%' and P.POST_Subestacion = @Feeder 
Group by P.POST_CodigoNodo, P.POST_Etiqueta, D.DEFI_IdElemento, p.POST_Interno, P.ALIM_Interno, Al.ALIM_Etiqueta
) as TD on TD.POST_Interno = po.POST_Interno
Where po.POST_Subestacion = @Feeder
and po.POST_Terceros = 0 and ALIM_Etiqueta is not null
Order By TD.POST_CodigoNodo desc
End


create Procedure [dbo].[sp_GetReportPostsByFeeder] 
@Feeder int
as 
Begin
Select 
	TD.ALIM_Etiqueta,
	TD.Fecha,
	po.POST_CodigoNodo,
	po.POST_Etiqueta,
	TD.TipoArmado,
	TD.ArmadoMaterial,
	TD.NEMA,
	TD.[6002],
	TD.[6004],
	TD.[6006],
	TD.[6008],
	TD.[6024],
	TD.[6026],
	TD.[6028],
	TD.Criticidad,
	TD.Ruta,
	TD.S0,
	TD.S1,
	TD.S2,
	TD.N
From Postes as po
left join(
Select --198
		P.POST_Interno,
		P.ALIM_Interno,
		P.POST_CodigoNodo,
		P.POST_Etiqueta,
		Al.ALIM_Etiqueta,
		MAX(CONVERT(varchar,isnull(D.DEFI_FecModificacion,D.DEFI_FecRegistro),103)) Fecha,
		MAX(D.DEFI_TipoArmado) TipoArmado,
		MAX(D.DEFI_ArmadoMaterial) ArmadoMaterial,
		'1C13' NEMA,
		MAX(IIF(C.CODI_Codigo = '6002','Sí','No')) [6002],
		MAX(IIF(C.CODI_Codigo = '6004','Sí','No')) [6004],
		MAX(IIF(C.CODI_Codigo = '6006','Sí','No')) [6006],
		MAX(IIF(C.CODI_Codigo = '6008','Sí','No')) [6008],
		MAX(IIF(C.CODI_Codigo = '6024','Sí','No')) [6024],
		MAX(IIF(C.CODI_Codigo = '6026','Sí','No')) [6026],
		MAX(IIF(C.CODI_Codigo = '6028','Sí','No')) [6028],
		MAX(Isnull(D.DEFI_EstadoCriticidad,0)) Criticidad,
		MIN(substring(a.arch_nombre, 1, CHARINDEX(P.POST_Etiqueta+'/', a.ARCH_Nombre)+(LEN(P.POST_Etiqueta)-1))) Ruta,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'POST' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =0 and
										DEFI_FecModificacion is not null) S0,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_Estado ='S' and
										DEFI_TipoElemento = 'POST' and
										DEFI_EstadoSubsanacion = 1 and
										DEFI_FecModificacion is not null) S1,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_Activo = 1 and
										DEFI_TipoElemento = 'POST' and
										DEFI_Estado ='S' and
										DEFI_EstadoSubsanacion =2 and
										DEFI_FecModificacion is not null)S2,
		(Select COUNT(DEFI_Interno) from Deficiencias where 
										DEFI_IdElemento = D.DEFI_IdElemento and 
										DEFI_TipoElemento = 'POST' and
										DEFI_Activo = 1 and
										DEFI_Estado ='N')N
from Postes as P 
left join Deficiencias as D on D.DEFI_IdElemento = P.POST_Interno and D.DEFI_TipoElemento = 'POST'
left join Archivos as A on A.ARCH_CodTabla = D.DEFI_Interno
left join Tipificaciones as T on T.TIPI_Interno = D.TIPI_Interno
left join Codigos as C on C.CODI_Interno = T.CODI_Interno
left join Alimentadores as Al on Al.ALIM_Interno = P.ALIM_Interno
Where
not (D.DEFI_Estado = 'S' and D.DEFI_FecModificacion is null)
and p.ALIM_Interno = @Feeder
and D.DEFI_Activo = 1
Group by P.POST_CodigoNodo, P.POST_Etiqueta, D.DEFI_IdElemento, p.POST_Interno, P.ALIM_Interno, Al.ALIM_Etiqueta
) as TD on TD.POST_Interno = po.POST_Interno
Where po.ALIM_Interno = @Feeder
and po.POST_Terceros = 0
Order By TD.POST_CodigoNodo desc
End


create Procedure [dbo].[sp_GetCountDefBTByFeeder]
@alim int
As
Begin
		Select 
			CO.CODI_Codigo,
			SUM(ISNULL(TD.S0,0))S0,
			SUM(ISNULL(TD.S1,0))S1,
			SUM(ISNULL(TD.S2,0))S2,
			SUM(ISNULL(TD.N,0))N
		from Codigos as CO
		left join(
		Select distinct
			C.CODI_Codigo,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='S' and def.DEFI_EstadoSubsanacion =0 
					and def.DEFI_FecModificacion is not null
					and po.POST_Subestacion = @Alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)S0,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='S' and def.DEFI_EstadoSubsanacion =1 
					and def.DEFI_FecModificacion is not null
					and po.POST_Subestacion = @alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)S1,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='S' and def.DEFI_EstadoSubsanacion =2
					and def.DEFI_FecModificacion is not null
					and po.POST_Subestacion = @Alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)S2,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='N'
					and po.POST_Subestacion = @Alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)N 
		from Postes as P --281
		left join Deficiencias as D on D.DEFI_IdElemento = P.POST_Interno and D.DEFI_TipoElemento = 'POST'
		left join Tipificaciones as T on T.TIPI_Interno = D.TIPI_Interno 
		join Codigos as C on C.CODI_Interno = T.CODI_Interno
		Where 
			P.POST_Subestacion = @alim
			and P.POST_Terceros =0
			and not(D.DEFI_Estado ='S' and D.DEFI_FecModificacion is null)
			and D.DEFI_Activo = 1
			and D.DEFI_Estado <> 'O'
		Group By 
			C.CODI_Codigo,D.DEFI_Interno,D.TIPI_Interno) as TD on TD.CODI_Codigo = CO.CODI_Codigo
		Where 
			CO.CODI_Codigo Between 6000 and 7000
		Group BY
			CO.CODI_Codigo
		Order By
		CO.CODI_Codigo
END


create Procedure [dbo].[sp_GetCountDefVBTByFeeder]
@alim int
As
Begin
		Select 
			CO.CODI_Codigo,
			SUM(ISNULL(TD.S0,0))S0,
			SUM(ISNULL(TD.S1,0))S1,
			SUM(ISNULL(TD.S2,0))S2,
			SUM(ISNULL(TD.N,0))N
		from Codigos as CO
		left join(
		Select distinct
			C.CODI_Codigo,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='S' and def.DEFI_EstadoSubsanacion =0 
					and def.DEFI_FecModificacion is not null
					and po.POST_Subestacion = @Alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)S0,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='S' and def.DEFI_EstadoSubsanacion =1 
					and def.DEFI_FecModificacion is not null
					and po.POST_Subestacion = @alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)S1,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='S' and def.DEFI_EstadoSubsanacion =2
					and def.DEFI_FecModificacion is not null
					and po.POST_Subestacion = @Alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)S2,
			(Select COUNT(def.DEFI_Interno) 
					from Deficiencias def
					join Postes po on po.POST_Interno = def.DEFI_IdElemento and def.DEFI_TipoElemento = 'POST'
					where def.DEFI_Estado='N'
					and po.POST_Subestacion = @Alim
					and po.POST_Terceros = 0
					and def.DEFI_Activo =1
					and D.TIPI_Interno = def.TIPI_Interno)N 
		from Postes as P --281
		left join Deficiencias as D on D.DEFI_IdElemento = P.POST_Interno and D.DEFI_TipoElemento = 'POST'
		left join Tipificaciones as T on T.TIPI_Interno = D.TIPI_Interno 
		join Codigos as C on C.CODI_Interno = T.CODI_Interno
		Where 
			P.POST_Subestacion = @alim
			and P.POST_Terceros =0
			and not(D.DEFI_Estado ='S' and D.DEFI_FecModificacion is null)
			and D.DEFI_Activo = 1
			and D.DEFI_Estado <> 'O'
		Group By 
			C.CODI_Codigo,D.DEFI_Interno,D.TIPI_Interno) as TD on TD.CODI_Codigo = CO.CODI_Codigo
		Where 
			CO.CODI_Codigo Between 7000 and 8000
		Group BY
			CO.CODI_Codigo
		Order By
		CO.CODI_Codigo
END


ALTER   PROCEDURE [dbo].[sp_GetListLatLongVANOSbySed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

select 
t.VANO_Etiqueta as Etiqueta,
t.VANO_Codigo as Codigo,
t.VANO_LatitudIni,
t.VANO_LongitudIni,
t.VANO_LatitudFin,
t.VANO_LongitudFin,
t.VANO_Terceros as Terceros,
t.VANO_Inspeccionado as Inspeccinado, 
t.TipoElemento,
d.DEFI_Estado
from (
select 
V.* , 
s.SED_Codigo,
'VANO' as TipoElemento
from Vanos V
inner join Seds s on s.SED_Interno = V.VANO_Subestacion
) as t
left join Deficiencias d on d.DEFI_IdElemento = t.VANO_Interno and t.TipoElemento = d.DEFI_TipoElemento
where t.SED_Codigo = @SED_Codigo and t.VANO_Terceros = 0
group by 
t.VANO_Etiqueta,
t.VANO_Codigo,
t.VANO_LatitudIni,
t.VANO_LongitudIni,
t.VANO_LatitudFin,
t.VANO_LongitudFin,
t.VANO_Terceros,
t.VANO_Inspeccionado, 
t.TipoElemento,
d.DEFI_Estado
END;


/**************\


ALTER   PROCEDURE [dbo].[sp_GetListLatLongPOSTbySed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

  SELECT
        t.POST_Etiqueta       AS Etiqueta,
        t.POST_CodigoNodo     AS Codigo,
        t.POST_Latitud        AS Latitud,
        t.POST_Longitud       AS Longitud,
        t.POST_Terceros       AS Terceros,
        t.POST_Inspeccionado  AS Inspeccinado,
        t.TipoElemento,
        d.DEFI_Estado
    FROM (
        SELECT 
        p.*, 
        s.SED_Codigo , 
        'POST' as TipoElemento
        FROM Postes p
        INNER JOIN Seds s 
            ON s.SED_Interno = p.POST_Subestacion
    ) AS t
    left join Deficiencias d on d.DEFI_IdElemento = t.POST_Interno and t.TipoElemento = d.DEFI_TipoElemento
    WHERE t.SED_Codigo = @SED_Codigo and t.POST_Terceros = 0
    group by 
    t.POST_Etiqueta,
    t.POST_CodigoNodo,
    t.POST_Latitud,
    t.POST_Longitud,
    t.POST_Terceros,
    t.POST_Inspeccionado,
    t.TipoElemento,
    d.DEFI_Estado
END;

CREATE PROCEDURE [dbo].[sp_ObtenerSEDInterno]
    @SED_Codigo VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT SED_Interno
    FROM Seds
    WHERE SED_Codigo = @SED_Codigo;
END;


create or alter   PROCEDURE [dbo].[sp_ListarPostesYVanosPorSed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

select distinct * from (   
   -- POSTES
    SELECT  
        t.POST_Interno        AS Interno,
        t.POST_CodigoNodo     AS Codigo,
        t.SED_Codigo          AS SedCodigo,
        t.POST_Inspeccionado  AS Inspeccinado,
        t.TipoElemento,
        d.DEFI_Estado
    FROM (
        SELECT p.*, s.SED_Codigo, 'POST' as TipoElemento
        FROM Postes p
        INNER JOIN Seds s 
            ON s.SED_Interno = p.POST_Subestacion
    ) AS t
    left join Deficiencias d on d.DEFI_IdElemento = t.POST_Interno and t.TipoElemento = d.DEFI_TipoElemento
    WHERE t.SED_Codigo = '1994' and t.POST_Terceros = 0

    UNION ALL

    -- VANOS
    SELECT  
        t.VANO_Interno        AS Interno,
        t.VANO_Codigo         AS Codigo,
        t.SED_Codigo          AS SedCodigo,
        t.VANO_Inspeccionado  AS Inspeccinado,
        t.TipoElemento,
        d.DEFI_Estado
    FROM (
        SELECT v.*, s.SED_Codigo, 'VANO' as TipoElemento
        FROM Vanos v
        INNER JOIN Seds s 
            ON s.SED_Interno = v.VANO_Subestacion
    ) AS t
    left join Deficiencias d on d.DEFI_IdElemento = t.VANO_Interno and t.TipoElemento = d.DEFI_TipoElemento
    WHERE t.SED_Codigo = '1994' and t.VANO_Terceros = 0 ) as t
END;

go

create or alter   PROCEDURE [dbo].[sp_GetListLatLongPOSTbySed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

  SELECT
        t.POST_Etiqueta       AS Etiqueta,
        t.POST_CodigoNodo     AS Codigo,
        t.POST_Latitud        AS Latitud,
        t.POST_Longitud       AS Longitud,
        t.POST_Terceros       AS Terceros,
        t.POST_Inspeccionado  AS Inspeccinado,
        t.TipoElemento,
        d.DEFI_Estado
    FROM (
        SELECT 
        p.*, 
        s.SED_Codigo , 
        'POST' as TipoElemento
        FROM Postes p
        INNER JOIN Seds s 
            ON s.SED_Interno = p.POST_Subestacion
    ) AS t
    left join Deficiencias d on d.DEFI_IdElemento = t.POST_Interno and t.TipoElemento = d.DEFI_TipoElemento
    WHERE t.SED_Codigo = @SED_Codigo and t.POST_Terceros = 0
    group by 
    t.POST_Etiqueta,
    t.POST_CodigoNodo,
    t.POST_Latitud,
    t.POST_Longitud,
    t.POST_Terceros,
    t.POST_Inspeccionado,
    t.TipoElemento,
    d.DEFI_Estado
END;

go

create or alter   PROCEDURE [dbo].[sp_GetListLatLongVANOSbySed]
    @SED_Codigo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

select 
t.VANO_Etiqueta as Etiqueta,
t.VANO_Codigo as Codigo,
t.VANO_LatitudIni,
t.VANO_LongitudIni,
t.VANO_LatitudFin,
t.VANO_LongitudFin,
t.VANO_Terceros as Terceros,
t.VANO_Inspeccionado as Inspeccinado, 
t.TipoElemento,
d.DEFI_Estado
from (
select 
V.* , 
s.SED_Codigo,
'VANO' as TipoElemento
from Vanos V
inner join Seds s on s.SED_Interno = V.VANO_Subestacion
) as t
left join Deficiencias d on d.DEFI_IdElemento = t.VANO_Interno and t.TipoElemento = d.DEFI_TipoElemento
where t.SED_Codigo = @SED_Codigo and t.VANO_Terceros = 0
group by 
t.VANO_Etiqueta,
t.VANO_Codigo,
t.VANO_LatitudIni,
t.VANO_LongitudIni,
t.VANO_LatitudFin,
t.VANO_LongitudFin,
t.VANO_Terceros,
t.VANO_Inspeccionado, 
t.TipoElemento,
d.DEFI_Estado
END;

go

create or alter PROCEDURE [dbo].[sp_GetElementoDetailsByCodigo]
    @CodigoNodo VARCHAR(50),
    @TipoElemento VARCHAR(10) -- 'POSTE' o 'VANO'
AS
BEGIN
    SET NOCOUNT ON;

    /* =========================
       CASO POSTE
    ==========================*/
    IF (@TipoElemento = 'POST')
    BEGIN
        SELECT distinct
            el.POST_Interno,
            el.TipoElemento,
            el.POST_Etiqueta,
            el.POST_CodigoNodo,
            el.POST_Latitud,
            el.POST_Longitud,
            el.POST_EsMT,
            el.POST_EsBT,
            el.POST_Inspeccionado,
            a.ALIM_Etiqueta,
            s.SED_Codigo,
            d.DEFI_Estado
        FROM Deficiencias d
        RIGHT JOIN (
            SELECT
                'POST' AS TipoElemento,
                p.*
            FROM Postes p
            INNER JOIN Alimentadores a 
                ON p.ALIM_Interno = a.ALIM_Interno
        ) AS el 
            ON d.DEFI_IdElemento = el.POST_Interno
           AND d.DEFI_TipoElemento = el.TipoElemento
        INNER JOIN Alimentadores a 
            ON a.ALIM_Interno = el.ALIM_Interno
        INNER JOIN Seds s 
            ON s.SED_Interno = el.POST_Subestacion
        WHERE el.POST_CodigoNodo = @CodigoNodo
    END

    /* =========================
       CASO VANO
    ==========================*/
    ELSE IF (@TipoElemento = 'VANO')
    BEGIN
        SELECT 
            el.VANO_Interno,
            el.TipoElemento,
            el.VANO_Etiqueta,
            el.VANO_Codigo,
            el.VANO_LatitudIni,
            el.VANO_LongitudIni,
            el.VANO_LatitudFin,
            el.VANO_LongitudFin,
            el.VANO_Inspeccionado,
            a.ALIM_Etiqueta,
            el.VANO_Material,
            el.VANO_NodoInicial,
            el.VANO_NodoFinal,
            el.VANO_EsMT,
            el.VANO_EsBT,
            s.SED_Codigo
        FROM Deficiencias d
        RIGHT JOIN (
            SELECT
                'VANO' AS TipoElemento,
                v.*
            FROM Vanos v
            INNER JOIN Alimentadores a 
                ON v.ALIM_Interno = a.ALIM_Interno
        ) AS el 
            ON d.DEFI_IdElemento = el.VANO_Interno
           AND d.DEFI_TipoElemento = el.TipoElemento
        INNER JOIN Alimentadores a 
            ON a.ALIM_Interno = el.ALIM_Interno
        INNER JOIN Seds s 
            ON s.SED_Interno = el.VANO_Subestacion
        WHERE el.VANO_Codigo = @CodigoNodo
    END

END

go

create or alter PROCEDURE [dbo].[sp_GetDeficienciasPorElemento]
    @TipoElemento VARCHAR(20),
    @IdElemento INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        d.DEFI_Estado,
        d.DEFI_FecRegistro,
        d.DEFI_EstadoCriticidad,
        d.DEFI_Comentario,
        d.DEFI_DistHorizontal,
        d.DEFI_DistVertical,
        d.DEFI_TipoRetenida,
        d.DEFI_RetenidaMaterial,
        d.DEFI_TipoArmado,
        d.DEFI_ArmadoMaterial,
        c.CODI_Codigo
    FROM Deficiencias d
    INNER JOIN Tipificaciones t 
        ON t.TIPI_Interno = d.TIPI_Interno
    INNER JOIN Codigos c 
        ON c.CODI_Interno = t.CODI_Interno
    WHERE d.DEFI_TipoElemento = @TipoElemento
      AND d.DEFI_IdElemento = @IdElemento;
END

