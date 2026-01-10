------------------------------------------------------------------
-- BUSCA DEFICIENCIAS POR ETIQUETA DE ELEMENTO + CODI_Codigo
------------------------------------------------------------------
DECLARE @etiqueta varchar(50) = '00132';

;WITH Q AS
(
    SELECT
        ElementoEtiqueta =
            CASE d.DEFI_TipoElemento
                WHEN 'POST' THEN p.POST_Etiqueta
                WHEN 'VANO' THEN v.VANO_Codigo
                ELSE NULL
            END,
        CODI_Codigo = c.CODI_Codigo,
        p.POST_EsBT,
        d.*
    FROM dbo.Deficiencias d
    LEFT JOIN dbo.Postes p
        ON d.DEFI_TipoElemento = 'POST'
       AND d.DEFI_IdElemento   = p.POST_Interno
    LEFT JOIN dbo.Vanos v
        ON d.DEFI_TipoElemento = 'VANO'
       AND d.DEFI_IdElemento   = v.VANO_Interno
    LEFT JOIN dbo.Tipificaciones t
        ON d.TIPI_Interno = t.TIPI_Interno
    LEFT JOIN dbo.Codigos c
        ON t.CODI_Interno = c.CODI_Interno
)
SELECT
    Q.DEFI_IdElemento,
    Q.ElementoEtiqueta,
    Q.DEFI_FechaCreacion,
    Q.DEFI_FecModificacion,
    Q.DEFI_TipoElemento,
    Q.CODI_Codigo,
    Q.DEFI_Interno,
    case q.DEFI_EstadoCriticidad 
        when '1' then 'Leve'
        when '2' then 'Moderado'
        when '3' then 'Grave'
    end as Criticidad,
    case Q.DEFI_EstadoSubsanacion
        when '0' then 'Por subsanar'
        when '1' then 'Subsanación Preventiva'
        when '2' then 'Subsanación Definitiva'
    end as [Estado subsanación],
    Q.DEFI_Observacion,
    Q.DEFI_Comentario,
    Q.DEFI_Activo,
    Q.DEFI_NumSuministro,
    Q.DEFI_DistHorizontal,
    Q.DEFI_DistVertical,
    [******] = '',
    q.*
FROM Q
WHERE Q.ElementoEtiqueta LIKE @etiqueta
    AND Q.POST_EsBT = 1
ORDER BY Q.DEFI_FechaCreacion DESC;
GO


--------------------------------
-- POSTES ----------------------
--------------------------------
DECLARE @etiqueta varchar(50) = '00132';
DECLARE @alimentador varchar(50) = 'MARIANO MELGAR';

SELECT
    a.ALIM_Etiqueta,
    P.POST_Etiqueta,
    pm.POSMT_Nombre,
    rt.RTNTP_Nombre,
    POST_Terceros,
    [***] = '',
    p.*
FROM dbo.Postes p
LEFT JOIN dbo.Alimentadores as a
    ON a.ALIM_Interno = p.ALIM_Interno
LEFT JOIN dbo.PosteMaterial as pm
    on p.POST_Material = pm.POSMT_Interno
LEFT JOIN dbo.RetenidaTipo as rt
    on p.POST_RetenidaTipo = rt.RTNTP_Interno
WHERE p.POST_Etiqueta = @etiqueta
    AND a.ALIM_Etiqueta = @alimentador
    AND p.POST_EsBT = 1;
GO


SELECT DEFI_Latitud,* FROM Deficiencias
------------------------------------------------------------------
-- BUSCA ARCHIVOS POR ETIQUETA DE ELEMENTO ----------------------
------------------------------------------------------------------
DECLARE @etiqueta varchar(20) = '00556';

;WITH Q AS
(
    SELECT
        ElementoEtiqueta =
            CASE a.ARCH_TipoElemento
                WHEN 'POST' THEN p.POST_Etiqueta
                WHEN 'VANO' THEN v.VANO_Etiqueta
                ELSE NULL
            END,
        a.*
    FROM dbo.Archivos AS a
    LEFT JOIN dbo.Postes AS p
        ON a.ARCH_TipoElemento = 'POST'
       AND a.ARCH_IdElemento   = p.POST_Interno
    LEFT JOIN dbo.Vanos AS v
        ON a.ARCH_TipoElemento = 'VANO'
       AND a.ARCH_IdElemento   = v.VANO_Interno
)
SELECT  Q.*
FROM Q
WHERE Q.ElementoEtiqueta LIKE @etiqueta
ORDER BY Q.ARCH_Fecha DESC;
GO


------------------------------------------------------------------
------------------------------------------------------------------
------------------------------------------------------------------


select * from Deficiencias order by DEFI_FechaCreacion desc




select DEFI_FechaCreacion,DEFI_Comentario,DEFI_Observacion,DEFI_Activo,* from Deficiencias
order by 1 desc




select * from Archivos order by ARCH_Fecha desc






select *
from Archivos
order by ARCH_Fecha desc


select * from Postes where POST_Etiqueta like '%057714%'

select * from Postes order by POST_Inspeccionado desc
select * from Vanos order by VANO_Inspeccionado desc

select * from ArmadoTipo

301329
247970

select DEFI_FechaCreacion,DEFI_Observacion,DEFI_Comentario,* from Deficiencias
order by 2 desc



select * from Postes
where POST_Etiqueta like '%011958%'












EXEC sp_columns 'Vanos';
