--------------------------------
-- POSTES ----------------------
--------------------------------
DECLARE @etiqueta varchar(50) = 'VBT000104754';
DECLARE @alimentador varchar(50) = 'MEJIA';

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


--------------------------------
-- VANOS -----------------------
--------------------------------
DECLARE @VanoCodigo varchar(50) = 'VBT000104754';
DECLARE @alimentador varchar(50) = 'mejia';
SELECT
    v.VANO_Codigo,
    v.VANO_NodoInicial,
    v.VANO_NodoFinal,
    [***] = '',
    v.*
FROM dbo.Vanos v
LEFT JOIN DBO.Alimentadores AS A
    ON A.ALIM_Interno = V.ALIM_Interno
WHERE v.VANO_Codigo like @VanoCodigo
    AND V.VANO_EsBT = 1
    AND A.ALIM_Etiqueta = @alimentador


    select * from Vanos where VANO_Subestacion = '1712' order by 2
------------------------------------------------------------------
-- BUSCA DEFICIENCIAS POR ETIQUETA DE POSTE O CÓDIGO DE VANO
------------------------------------------------------------------
DECLARE @codigo varchar(50) = '00132'; --Varias si es especifico o contiene

;WITH Q AS
(
    SELECT
        ElementoEtiqueta =
            CASE d.DEFI_TipoElemento
                WHEN 'POST' THEN P.POST_Etiqueta
                WHEN 'VANO' THEN V.VANO_Codigo
                ELSE NULL
            END,
        CODI_Codigo = C.CODI_Codigo,
        P.POST_EsBT,
        D.*
    FROM dbo.Deficiencias AS D
    LEFT JOIN Postes AS P
        ON D.DEFI_TipoElemento = 'POST'
       AND D.DEFI_IdElemento   = P.POST_Interno
    LEFT JOIN dbo.Vanos AS V
        ON D.DEFI_TipoElemento = 'VANO'
       AND D.DEFI_IdElemento   = V.VANO_Interno
    LEFT JOIN Tipificaciones AS T
        ON D.TIPI_Interno = T.TIPI_Interno
    LEFT JOIN Codigos AS C
        ON T.CODI_Interno = C.CODI_Interno
)
SELECT
    Q.DEFI_Interno,
    Q.DEFI_IdElemento,
    Q.ElementoEtiqueta,
    Q.DEFI_FechaCreacion,
    Q.DEFI_FecModificacion,
    Q.DEFI_TipoElemento,
    Q.CODI_Codigo,
    Q.DEFI_Interno,
    case Q.DEFI_EstadoCriticidad 
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
    Q.DEFI_Accesibilidad,
    Q.DEFI_TipoCruce,
    Q.DEFI_DistVertical,
    [******] = '',
    q.*
FROM Q
WHERE Q.ElementoEtiqueta LIKE @codigo
AND (
        Q.DEFI_TipoElemento <> 'POST'
        OR Q.POST_EsBT = 1
      )
ORDER BY Q.DEFI_FechaCreacion DESC;
GO

select * from Deficiencias

--------------------------------
-- delete defi VANOS -----------------------
--------------------------------


delete from Deficiencias
where DEFI_Interno = 111468






------------------------------------------------------------------
-- BUSCAR TODOS LOS ELEMENTOS DE UNA SUBESTACIÓN -----------------
------------------------------------------------------------------

DECLARE @SUB_ETI VARCHAR(20) = '%8102%'
(
    SELECT  
            ALI.ALIM_Interno AS [Id Alimentador],
            ALI.ALIM_Etiqueta AS [Etiqueta alimentador],
            S.SED_Interno AS [ID Sub Interno],
            S.SED_Etiqueta AS [Etiqueta Sub],
            Elemento = 'Poste',
            P.POST_Interno AS [ID Elemento interno],
            P.POST_Etiqueta AS [Etiqueta elemento]
        
    FROM Postes AS P
    LEFT JOIN Seds AS S
        ON P.POST_Subestacion = S.SED_Interno
    LEFT JOIN Alimentadores AS ALI
        ON P.ALIM_Interno = ALI.ALIM_Interno
    WHERE S.SED_Etiqueta LIKE @SUB_ETI


    union all


    SELECT  ALI.ALIM_Interno AS [Id Alimentador],
            ALI.ALIM_Etiqueta AS [Etiqueta alimentador],
            S.SED_Interno AS [ID Sub Interno],
            S.SED_Etiqueta AS [Etiqueta Sub],
            Elemento = 'Vano',
            V.VANO_Interno AS [ID Interno],
            V.VANO_Codigo [Etiqueta]
    FROM Vanos AS V
    LEFT JOIN Seds AS S
        ON V.VANO_Subestacion = S.SED_Interno
    LEFT JOIN Alimentadores AS ALI
        ON V.ALIM_Interno = ALI.ALIM_Interno

    WHERE S.SED_Etiqueta LIKE @SUB_ETI
)
ORDER BY [Etiqueta elemento]


------------------------------------------------------------------
-- TOADAS LAS DEFICIENCIAS DE UNA SUBESTACIÓN --------
------------------------------------------------------------------

DECLARE @SUB_ETI VARCHAR(20) = '%8102%';

SELECT  
        D.DEFI_Interno,
        ROW_NUMBER() OVER (PARTITION BY D.DEFI_IdElemento ORDER BY D.DEFI_FechaCreacion) AS Nro, 
        D.DEFI_TipoElemento,
        ElementoEtiqueta =
            CASE d.DEFI_TipoElemento
                WHEN 'POST' THEN p.POST_Etiqueta
                WHEN 'VANO' THEN v.VANO_Codigo
                ELSE NULL
            END,
        D.DEFI_FechaCreacion,
        D.DEFI_FecModificacion,
        C.CODI_Codigo,
        D.DEFI_Interno,
        case D.DEFI_EstadoCriticidad 
            when '1' then 'Leve'
            when '2' then 'Moderado'
            when '3' then 'Grave'
        end as Criticidad,
        case D.DEFI_EstadoSubsanacion
            when '0' then 'Por subsanar'
            when '1' then 'Subsanación Preventiva'
            when '2' then 'Subsanación Definitiva'
        end as [Estado subsanación],
        D.DEFI_NumSuministro,
        D.DEFI_Observacion,
        D.DEFI_Comentario,
        D.DEFI_Activo,
        D.DEFI_DistHorizontal,
        D.DEFI_Accesibilidad,
        D.DEFI_TipoCruce,
        D.DEFI_DistVertical,
        [***] = '',
        *
FROM Deficiencias AS D
    LEFT JOIN Tipificaciones  AS T
        ON D.TIPI_Interno = T.TIPI_Interno
    LEFT JOIN Codigos AS C
        ON T.CODI_Interno = C.CODI_Interno
       LEFT JOIN Vanos AS V
        ON D.DEFI_IdElemento = V.VANO_Interno
    LEFT JOIN Postes AS P
        ON D.DEFI_IdElemento = P.POST_Interno
WHERE D.DEFI_IdElemento IN

(
    SELECT P.POST_Interno
        FROM Postes AS P
        INNER JOIN Seds AS S
            ON P.POST_Subestacion = S.SED_Interno
        WHERE S.SED_Etiqueta LIKE @SUB_ETI
UNION ALL
    SELECT V.VANO_Interno
        FROM Vanos AS V
        INNER JOIN Seds AS S
            ON V.VANO_Subestacion = S.SED_Interno
        WHERE S.SED_Etiqueta LIKE @SUB_ETI
)

ORDER BY D.DEFI_IdElemento, Nro;


------------------------------------------------------------------
-- BORRAR DEFICIENCIAS MASIVO ------------------------------------
------------------------------------------------------------------
BEGIN TRANSACTION

DELETE FROM Deficiencias
WHERE DEFI_Interno IN 
(

)

ROLLBACK




------------------------------------------------------------------
-- BUSCA ARCHIVOS POR ETIQUETA DE ELEMENTO ----------------------
------------------------------------------------------------------
DECLARE @etiqueta varchar(20) = '%327219%';

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




------------------------------------------------------------------
------------------------------------------------------------------
------------------------------------------------------------------



------------------------------------------------------------------
------------------------------------------------------------------
------------------------------------------------------------------



















