/*==============================================================================
  DEFICIENCIAS DE UNA SUBESTACIÓN
  Busca todas las deficiencias de una subestación
==============================================================================*/

DECLARE @SED VARCHAR(20) = '2755';

------------------------------------------------------------
-- TODAS LAS DEFICIENCIAS DE UNA SUBESTACIÓN 
------------------------------------------------------------


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
        WHERE S.SED_Etiqueta LIKE '%' + @SED + '%'
            OR S.SED_Etiqueta = @SED
UNION ALL
    SELECT V.VANO_Interno
        FROM Vanos AS V
        INNER JOIN Seds AS S
            ON V.VANO_Subestacion = S.SED_Interno
        WHERE S.SED_Etiqueta LIKE '%' + @SED + '%'
            OR S.SED_Etiqueta = @SED
)

ORDER BY C.CODI_Codigo, D.DEFI_CodigoElemento;