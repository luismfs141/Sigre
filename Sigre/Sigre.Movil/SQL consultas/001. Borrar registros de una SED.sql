
------------------------------------------------------------------
-- TOADAS LAS DEFICIENCIAS DE UNA SUBESTACIÓN --------
------------------------------------------------------------------

DECLARE @SUB_ETI VARCHAR(20) = '%2755%';

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
        D.DEFI_CodigoElemento,
        C.CODI_Codigo,
        D.DEFI_FechaCreacion,
        D.DEFI_FecModificacion,
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

ORDER BY C.CODI_Codigo, D.DEFI_CodigoElemento;




------------------------------------------------------------------
-- BUSCA DEFICIENCIAS POR CÓDIGO DE ELEMENTO ---------------------
------------------------------------------------------------------

DECLARE @codigo varchar(50) = '%000132360'; 

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
WHERE Q.DEFI_CodigoElemento LIKE @codigo
AND (
        Q.DEFI_TipoElemento <> 'POST'
        OR Q.POST_EsBT = 1
      )
ORDER BY Q.DEFI_FechaCreacion DESC;
GO


----------------------------------------------------------------------
-- BORRAR TODAS DEFICIENCIAS DE UNA SUBESTACIÓN ----------------------
----------------------------------------------------------------------

DECLARE @SED_CODIGO VARCHAR(50) = '1994%';  -- <-- tu SED_Codigo

SELECT COUNT(*) AS TotalAEliminar
FROM Deficiencias D
LEFT JOIN Postes P ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos  V ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds  S ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo like @SED_CODIGO;
GO

 --**************

DECLARE @SED_CODIGO VARCHAR(50) = '1994%';  -- <-- tu SED_Codigo

BEGIN TRAN;

DELETE D
FROM Deficiencias D
LEFT JOIN Postes P ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos  V ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds  S ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo like @SED_CODIGO;

--SELECT @@ROWCOUNT AS FilasEliminadas;

--COMMIT;
 ROLLBACK;



