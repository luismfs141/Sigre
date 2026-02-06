------------------------------------------------------------------
-- BUSCA ARCHIVOS POR ETIQUETA DE ELEMENTO ----------------------
------------------------------------------------------------------

DECLARE @CodElemento varchar(20) = '%057740';

;WITH Q AS
(
    SELECT
        ElementoEtiqueta =
            CASE a.ARCH_TipoElemento
                WHEN 'POST' THEN p.POST_Etiqueta
                WHEN 'VANO' THEN v.VANO_Etiqueta
                ELSE NULL
            END,
    d.DEFI_CodigoElemento,
        a.*
    FROM dbo.Archivos AS a
    LEFT JOIN dbo.Postes AS p
        ON a.ARCH_TipoElemento = 'POST'
       AND a.ARCH_IdElemento   = p.POST_Interno
    LEFT JOIN dbo.Vanos AS v
        ON a.ARCH_TipoElemento = 'VANO'
       AND a.ARCH_IdElemento   = v.VANO_Interno
    LEFT JOIN dbo.Deficiencias as d
        on a.ARCH_CodTabla = d.DEFI_Interno
)
SELECT  Q.*
FROM Q
WHERE Q.DEFI_CodigoElemento LIKE @CodElemento
ORDER BY Q.ElementoEtiqueta DESC;
GO


------------------------------------------------------------------
-- BUSCA TODOS LOS ARCHIVOS POR CODIGO DE SED ------------------------------
------------------------------------------------------------------

DECLARE @SED_CODIGO VARCHAR(50) = '%1994%';  -- <-- tu SED_Codigo

SELECT
    S.SED_Codigo,
    S.SED_Etiqueta,
    A.*,
    D.DEFI_Interno,
    D.DEFI_TipoElemento,
    D.DEFI_IdElemento,
    ElementoEtiqueta =
        CASE D.DEFI_TipoElemento
            WHEN 'POST' THEN P.POST_Etiqueta
            WHEN 'VANO' THEN V.VANO_Codigo
            ELSE NULL
        END
FROM Archivos A
INNER JOIN Deficiencias D
    ON A.ARCH_CodTabla = D.DEFI_Interno
LEFT JOIN Postes P
    ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos V
    ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds S
    ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo like @SED_CODIGO
ORDER BY A.ARCH_Fecha DESC;
GO

------------------------------------------------------------------
-- BORRAR TODOS LOS ARCHIVOS POR CODIGO DE SED -------------------
------------------------------------------------------------------

DECLARE @SED_CODIGO VARCHAR(50) = '%1994%';

SELECT COUNT(*) AS TotalArchivosAEliminar
FROM Archivos A
INNER JOIN Deficiencias D ON A.ARCH_CodTabla = D.DEFI_Interno
LEFT JOIN Postes P ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos  V ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds  S ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo LIKE @SED_CODIGO;
GO

--************


DECLARE @SED_CODIGO VARCHAR(50) = '%1994%';

BEGIN TRAN;

DELETE A
FROM Archivos A
INNER JOIN Deficiencias D ON A.ARCH_CodTabla = D.DEFI_Interno
LEFT JOIN Postes P ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos  V ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds  S ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo LIKE @SED_CODIGO;

--SELECT @@ROWCOUNT AS ArchivosEliminados;

--COMMIT;
ROLLBACK;
