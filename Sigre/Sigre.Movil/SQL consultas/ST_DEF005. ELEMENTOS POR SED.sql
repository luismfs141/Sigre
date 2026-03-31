/*==============================================================================
  TODOS LOS SED DE UN ALIMENTADOR
  (opcional) 
==============================================================================*/

DECLARE @ALIM_ETIQUETA VARCHAR(60) = 'LAS FLORES'
DECLARE @ALIM_COD VARCHAR(60) = NULL
DECLARE @ALIM_INTERNO VARCHAR(60) = NULL

SELECT  AL.ALIM_Interno,
        AL.ALIM_Etiqueta,
        SE.SED_Interno,
        SE.SED_Codigo,
        [***]=''
        --,SE.*
FROM Seds AS SE
LEFT JOIN Alimentadores AS AL
    ON SE.ALIM_Interno = AL.ALIM_Interno
WHERE AL.ALIM_Etiqueta = @ALIM_ETIQUETA 
    OR AL.ALIM_Etiqueta LIKE '%' + @ALIM_ETIQUETA + '%'
    OR AL.ALIM_Codigo = @ALIM_COD
    OR AL.ALIM_Codigo LIKE '%' + @ALIM_COD + '%'
    OR AL.ALIM_Interno = @ALIM_INTERNO
    OR AL.ALIM_Interno LIKE '%' + @ALIM_INTERNO + '%'
GO



/*==============================================================================
  BUSCAR ALIMENTADOR POR CODIGO DE SED
  (opcional) 
==============================================================================*/

DECLARE @COD_SED VARCHAR(60) = '3616'

SELECT  AL.ALIM_Interno,
        AL.ALIM_Etiqueta,
        SE.ALIM_Interno,
        SE.SED_Codigo
FROM Seds AS SE
LEFT JOIN Alimentadores AS AL
    ON SE.ALIM_Interno = AL.ALIM_Interno
WHERE SE.SED_Codigo = @COD_SED
    OR SE.SED_Codigo LIKE '%' + @COD_SED + '%'
GO



/*==============================================================================
  TODOS LOS ELEMENTOS DE UNA SED
  (opcional) 
==============================================================================*/

DECLARE @COD_SED VARCHAR(20) = '2501'

------------------------------------------------------------
--  DEFICIENCIAS DE UN ELEMETNO
------------------------------------------------------------
(
    SELECT  VA.VANO_Interno,
            VA.VANO_Codigo,
            SE.SED_Codigo,
            AL.ALIM_Interno AS [AL x SED],
            AL.ALIM_Etiqueta,
            AL2.ALIM_Interno AS [AL x VA],
            AL2.ALIM_Etiqueta,
            [***]='',
            VA.VANO_Terceros
            
    FROM VANOS AS VA
    LEFT JOIN Seds AS SE
        ON VA.VANO_Subestacion = SE.SED_Interno
    LEFT JOIN Alimentadores AS AL
        ON SE.ALIM_Interno = AL.ALIM_Interno
    LEFT JOIN Alimentadores AS AL2
        ON VA.ALIM_Interno = AL2.ALIM_Interno
    WHERE VA.VANO_EsBT = 1
        AND (SE.SED_Codigo = @COD_SED
        OR SE.SED_Codigo LIKE '%'+ @COD_SED + '%')

UNION ALL

    SELECT  PO.POST_Interno,
            PO.POST_CodigoNodo,
            SE.SED_Codigo,
            AL.ALIM_Interno AS [AL x SED],
            AL.ALIM_Etiqueta,
            AL2.ALIM_Interno AS [AL x VA],
            AL2.ALIM_Etiqueta,
            [***]='',
            PO.POST_Terceros
            
    FROM Postes AS PO
    LEFT JOIN Seds AS SE
        ON PO.POST_Subestacion = SE.SED_Interno
    LEFT JOIN Alimentadores AS AL
        ON SE.ALIM_Interno = AL.ALIM_Interno
    LEFT JOIN Alimentadores AS AL2
        ON PO.ALIM_Interno = AL2.ALIM_Interno
    WHERE PO.POST_EsBT = 1
        AND (SE.SED_Codigo = @COD_SED
        OR SE.SED_Codigo LIKE '%'+ @COD_SED + '%')
)
ORDER BY 2
GO


/*==============================================================================
  CORREGIR VANOS A ALIMENTADOR CORRECTO
  (opcional) 
==============================================================================*/

------------------------------------------------------------
--  PRIMER REVISAR QUE SE MODIFICARÁN
------------------------------------------------------------

DECLARE @COD_SED VARCHAR(20) = '1151'

SELECT
    'VANO' AS Tipo,
    VA.VANO_Interno AS Id,
    VA.VANO_Codigo AS Codigo,
    VA.ALIM_Interno AS AlimActual,
    SE.ALIM_Interno AS AlimSegunSed
FROM Vanos AS VA
INNER JOIN Seds AS SE
    ON VA.VANO_Subestacion = SE.SED_Interno
WHERE VA.VANO_EsBT = 1
  AND (
        SE.SED_Codigo = @COD_SED
        OR SE.SED_Codigo LIKE '%' + @COD_SED + '%'
      )
  AND ISNULL(VA.ALIM_Interno, -1) <> ISNULL(SE.ALIM_Interno, -1)

UNION ALL

SELECT
    'POSTE' AS Tipo,
    PO.POST_Interno AS Id,
    PO.POST_CodigoNodo AS Codigo,
    PO.ALIM_Interno AS AlimActual,
    SE.ALIM_Interno AS AlimSegunSed
FROM Postes AS PO
INNER JOIN Seds AS SE
    ON PO.POST_Subestacion = SE.SED_Interno
WHERE PO.POST_EsBT = 1
  AND (
        SE.SED_Codigo = @COD_SED
        OR SE.SED_Codigo LIKE '%' + @COD_SED + '%'
      )
  AND ISNULL(PO.ALIM_Interno, -1) <> ISNULL(SE.ALIM_Interno, -1);
GO

------------------------------------------------------------
--  UPDATE DE REGISTROS ERRONEOS
------------------------------------------------------------

DECLARE @COD_SED VARCHAR(20) = '1151';

BEGIN TRANSACTION 

-- VANOS
UPDATE VA
SET VA.ALIM_Interno = SE.ALIM_Interno
FROM Vanos AS VA
INNER JOIN Seds AS SE
    ON VA.VANO_Subestacion = SE.SED_Interno
WHERE VA.VANO_EsBT = 1
  AND (
        SE.SED_Codigo = @COD_SED
        OR SE.SED_Codigo LIKE '%' + @COD_SED + '%'
      )
  AND ISNULL(VA.ALIM_Interno, -1) <> ISNULL(SE.ALIM_Interno, -1);

-- POSTES
UPDATE PO
SET PO.ALIM_Interno = SE.ALIM_Interno
FROM Postes AS PO
INNER JOIN Seds AS SE
    ON PO.POST_Subestacion = SE.SED_Interno
WHERE PO.POST_EsBT = 1
  AND (
        SE.SED_Codigo = @COD_SED
        OR SE.SED_Codigo LIKE '%' + @COD_SED + '%'
      )
  AND ISNULL(PO.ALIM_Interno, -1) <> ISNULL(SE.ALIM_Interno, -1);

ROLLBACK
--COMMIT


GO






/*==============================================================================
  CAMBIAR SED A OTRO ALIMENTADOR
  (opcional) 
==============================================================================*/

------------------------------------------------------------
-- CONSULTAR ALIMENTADORSE
------------------------------------------------------------
SELECT * 
FROM Alimentadores
ORDER BY 5

------------------------------------------------------------
-- CREAR ALIMENTADOR
------------------------------------------------------------
BEGIN TRANSACTION
INSERT INTO Alimentadores (ALIM_Codigo, ALIM_Latitud, ALIM_Longitud, ALIM_Etiqueta)
VALUES
('9996',-16,-71,'EMBAJADA DE JAPON')
ROLLBACK
--COMMIT
GO






------------------------------------------------------------
-- UPDATE
------------------------------------------------------------

DECLARE @COD_SED    VARCHAR(20) = '2501';
DECLARE @NUEVO_ALIM_INTERNO INT = 84; -- <-- aquí pones el ALIM_Interno nuevo

BEGIN TRAN;


--------- VALIDACIONES ---------

IF NOT EXISTS (
    SELECT 1
    FROM Alimentadores
    WHERE ALIM_Interno = @NUEVO_ALIM_INTERNO
)
BEGIN
    RAISERROR('El nuevo ALIM_Interno no existe en Alimentadores.', 16, 1);
    ROLLBACK TRAN;
    RETURN;
END;

IF NOT EXISTS (
    SELECT 1
    FROM Seds
    WHERE SED_Codigo = @COD_SED
       OR SED_Codigo LIKE '%' + @COD_SED + '%'
)
BEGIN
    RAISERROR('No existe ninguna SED con ese código/filtro.', 16, 1);
    ROLLBACK TRAN;
    RETURN;
END;


--------- VISTA PREVIA: LO QUE SE VA A CAMBIAR ---------

SELECT
    'SED' AS Tipo,
    S.SED_Interno AS IdInterno,
    S.SED_Codigo AS Codigo,
    S.ALIM_Interno AS AlimActual,
    @NUEVO_ALIM_INTERNO AS AlimNuevo
FROM Seds S
WHERE S.SED_Codigo = @COD_SED
   OR S.SED_Codigo LIKE '%' + @COD_SED + '%'

UNION ALL

SELECT
    'POSTE' AS Tipo,
    P.POST_Interno AS IdInterno,
    P.POST_CodigoNodo AS Codigo,
    P.ALIM_Interno AS AlimActual,
    @NUEVO_ALIM_INTERNO AS AlimNuevo
FROM Postes P
INNER JOIN Seds S
    ON P.POST_Subestacion = S.SED_Interno
WHERE P.POST_EsBT = 1
  AND (
        S.SED_Codigo = @COD_SED
        OR S.SED_Codigo LIKE '%' + @COD_SED + '%'
      )

UNION ALL

SELECT
    'VANO' AS Tipo,
    V.VANO_Interno AS IdInterno,
    V.VANO_Codigo AS Codigo,
    V.ALIM_Interno AS AlimActual,
    @NUEVO_ALIM_INTERNO AS AlimNuevo
FROM Vanos V
INNER JOIN Seds S
    ON V.VANO_Subestacion = S.SED_Interno
WHERE V.VANO_EsBT = 1
  AND (
        S.SED_Codigo = @COD_SED
        OR S.SED_Codigo LIKE '%' + @COD_SED + '%'
      );




------------------------------------------------------------
--UPDATE DE LA SED
------------------------------------------------------------

UPDATE S
SET S.ALIM_Interno = @NUEVO_ALIM_INTERNO
FROM Seds S
WHERE S.SED_Codigo = @COD_SED
   OR S.SED_Codigo LIKE '%' + @COD_SED + '%';

--------- UPDATE DE POSTES DE ESA SED ---------
UPDATE P
SET P.ALIM_Interno = @NUEVO_ALIM_INTERNO
FROM Postes P
INNER JOIN Seds S
    ON P.POST_Subestacion = S.SED_Interno
WHERE P.POST_EsBT = 1
  AND (
        S.SED_Codigo = @COD_SED
        OR S.SED_Codigo LIKE '%' + @COD_SED + '%'
      );

--------- UPDATE DE VANOS DE ESA SED ---------

UPDATE V
SET V.ALIM_Interno = @NUEVO_ALIM_INTERNO
FROM Vanos V
INNER JOIN Seds S
    ON V.VANO_Subestacion = S.SED_Interno
WHERE V.VANO_EsBT = 1
  AND (
        S.SED_Codigo = @COD_SED
        OR S.SED_Codigo LIKE '%' + @COD_SED + '%'
      );


ROLLBACK
--COMMIT TRAN;








/*==============================================================================
  CONSULTAR ELEMENTO
  (opcional) 
==============================================================================*/

------------------------------------------------------------
-- CONSULTAR ELEMENTO
------------------------------------------------------------

DECLARE @COD_POS_OR_VAN VARCHAR(20) = 'PTO000133411'

------------------------------------------------------------
--  DEFICIENCIAS DE UN ELEMETNO
------------------------------------------------------------
(
    SELECT  VA.VANO_Interno,
            VA.VANO_Codigo,
            SE.SED_Interno,
            SE.SED_Codigo,
            AL.ALIM_Interno AS [AL x SED],
            AL.ALIM_Etiqueta,
            AL2.ALIM_Interno AS [AL x VA],
            AL2.ALIM_Etiqueta,
            [***]='',
            VA.VANO_Terceros
            
    FROM VANOS AS VA
    LEFT JOIN Seds AS SE
        ON VA.VANO_Subestacion = SE.SED_Interno
    LEFT JOIN Alimentadores AS AL
        ON SE.ALIM_Interno = AL.ALIM_Interno
    LEFT JOIN Alimentadores AS AL2
        ON VA.ALIM_Interno = AL2.ALIM_Interno
    WHERE VA.VANO_EsBT = 1
        AND (VA.VANO_Codigo = @COD_POS_OR_VAN
        OR VA.VANO_Codigo LIKE '%'+ @COD_POS_OR_VAN + '%')

UNION ALL

    SELECT  PO.POST_Interno,
            PO.POST_CodigoNodo,
            SE.SED_Interno,
            SE.SED_Codigo,
            AL.ALIM_Interno AS [AL x SED],
            AL.ALIM_Etiqueta,
            AL2.ALIM_Interno AS [AL x VA],
            AL2.ALIM_Etiqueta,
            [***]='',
            PO.POST_Terceros
            
    FROM Postes AS PO
    LEFT JOIN Seds AS SE
        ON PO.POST_Subestacion = SE.SED_Interno
    LEFT JOIN Alimentadores AS AL
        ON SE.ALIM_Interno = AL.ALIM_Interno
    LEFT JOIN Alimentadores AS AL2
        ON PO.ALIM_Interno = AL2.ALIM_Interno
    WHERE PO.POST_EsBT = 1
        AND (PO.POST_CodigoNodo = @COD_POS_OR_VAN
        OR PO.POST_CodigoNodo LIKE '%'+ @COD_POS_OR_VAN + '%')
)
GO




/*==================================================================================================================================
  CAMBIAR SED A UN ELEMENTO
  (opcional) 
==================================================================================================================================*/

DECLARE @COD_POS_OR_VAN      VARCHAR(20)  = 'PTO000133411';
DECLARE @NUEVO_COD_SED       VARCHAR(20)  = '2501';

DECLARE @NUEVO_SED_INTERNO   INT;
DECLARE @NUEVO_ALIM_INTERNO  INT;
DECLARE @NUEVO_ALIM_ETIQUETA VARCHAR(200);

DECLARE @EXISTE_POSTE        INT = 0;
DECLARE @EXISTE_VANO         INT = 0;

BEGIN TRY
    ------------------------------------------------------------
    -- OBTENER NUEVA SED Y SU ALIMENTADOR
    ------------------------------------------------------------
    SELECT
        @NUEVO_SED_INTERNO   = S.SED_Interno,
        @NUEVO_ALIM_INTERNO  = S.ALIM_Interno,
        @NUEVO_ALIM_ETIQUETA = A.ALIM_Etiqueta
    FROM Seds S
    LEFT JOIN Alimentadores A
        ON A.ALIM_Interno = S.ALIM_Interno
    WHERE S.SED_Codigo = @NUEVO_COD_SED;

    IF @NUEVO_SED_INTERNO IS NULL
    BEGIN
        RAISERROR('La nueva SED no existe.', 16, 1);
        RETURN;
    END;

    ------------------------------------------------------------
    -- VALIDAR SI EL CÓDIGO EXISTE EN POSTE O EN VANO
    ------------------------------------------------------------
    SELECT @EXISTE_POSTE = COUNT(*)
    FROM Postes P
    WHERE P.POST_EsBT = 1
      AND P.POST_CodigoNodo = @COD_POS_OR_VAN;

    SELECT @EXISTE_VANO = COUNT(*)
    FROM Vanos V
    WHERE V.VANO_EsBT = 1
      AND V.VANO_Codigo = @COD_POS_OR_VAN;

    IF @EXISTE_POSTE = 0 AND @EXISTE_VANO = 0
    BEGIN
        RAISERROR('El código indicado no existe ni en Postes ni en Vanos BT.', 16, 1);
        RETURN;
    END;

    IF @EXISTE_POSTE > 0 AND @EXISTE_VANO > 0
    BEGIN
        RAISERROR('El código existe tanto en Postes como en Vanos. Usa un código único.', 16, 1);
        RETURN;
    END;

    ------------------------------------------------------------
    -- VISTA PREVIA ANTES DEL UPDATE
    ------------------------------------------------------------
    PRINT '===== VISTA PREVIA ANTES =====';

    IF @EXISTE_POSTE > 0
    BEGIN
        SELECT
            TipoElemento               = 'POSTE',
            IdInterno                  = P.POST_Interno,
            CodigoElemento             = P.POST_CodigoNodo,
            SubestacionActual          = SActual.SED_Codigo,
            NuevaSubestacion           = @NUEVO_COD_SED,
            AlimentadorActual          = P.ALIM_Interno,
            AlimentadorActualEtiqueta  = AActual.ALIM_Etiqueta,
            NuevoAlimentador           = @NUEVO_ALIM_INTERNO,
            NuevoAlimentadorEtiqueta   = @NUEVO_ALIM_ETIQUETA
        FROM Postes P
        LEFT JOIN Seds SActual
            ON SActual.SED_Interno = P.POST_Subestacion
        LEFT JOIN Alimentadores AActual
            ON AActual.ALIM_Interno = P.ALIM_Interno
        WHERE P.POST_EsBT = 1
          AND P.POST_CodigoNodo = @COD_POS_OR_VAN;
    END;

    IF @EXISTE_VANO > 0
    BEGIN
        SELECT
            TipoElemento               = 'VANO',
            IdInterno                  = V.VANO_Interno,
            CodigoElemento             = V.VANO_Codigo,
            SubestacionActual          = SActual.SED_Codigo,
            NuevaSubestacion           = @NUEVO_COD_SED,
            AlimentadorActual          = V.ALIM_Interno,
            AlimentadorActualEtiqueta  = AActual.ALIM_Etiqueta,
            NuevoAlimentador           = @NUEVO_ALIM_INTERNO,
            NuevoAlimentadorEtiqueta   = @NUEVO_ALIM_ETIQUETA
        FROM Vanos V
        LEFT JOIN Seds SActual
            ON SActual.SED_Interno = V.VANO_Subestacion
        LEFT JOIN Alimentadores AActual
            ON AActual.ALIM_Interno = V.ALIM_Interno
        WHERE V.VANO_EsBT = 1
          AND V.VANO_Codigo = @COD_POS_OR_VAN;
    END;

    ------------------------------------------------------------
    -- INICIAR TRANSACCIÓN
    ------------------------------------------------------------
    BEGIN TRAN;

    ------------------------------------------------------------
    -- CASO POSTE
    ------------------------------------------------------------
    IF @EXISTE_POSTE > 0
    BEGIN
        UPDATE P
        SET
            P.POST_Subestacion = @NUEVO_SED_INTERNO,
            P.ALIM_Interno = CASE
                                WHEN ISNULL(P.ALIM_Interno, -1) <> ISNULL(@NUEVO_ALIM_INTERNO, -1)
                                THEN @NUEVO_ALIM_INTERNO
                                ELSE P.ALIM_Interno
                             END
        FROM Postes P
        WHERE P.POST_EsBT = 1
          AND P.POST_CodigoNodo = @COD_POS_OR_VAN;
    END;

    ------------------------------------------------------------
    -- CASO VANO
    ------------------------------------------------------------
    IF @EXISTE_VANO > 0
    BEGIN
        UPDATE V
        SET
            V.VANO_Subestacion = @NUEVO_SED_INTERNO,
            V.ALIM_Interno = CASE
                                WHEN ISNULL(V.ALIM_Interno, -1) <> ISNULL(@NUEVO_ALIM_INTERNO, -1)
                                THEN @NUEVO_ALIM_INTERNO
                                ELSE V.ALIM_Interno
                             END
        FROM Vanos V
        WHERE V.VANO_EsBT = 1
          AND V.VANO_Codigo = @COD_POS_OR_VAN;
    END;

    ------------------------------------------------------------
    -- VISTA DESPUÉS DEL UPDATE
    ------------------------------------------------------------
    PRINT '===== VISTA DESPUÉS =====';

    IF @EXISTE_POSTE > 0
    BEGIN
        SELECT
            TipoElemento              = 'POSTE',
            IdInterno                 = P.POST_Interno,
            CodigoElemento            = P.POST_CodigoNodo,
            SubestacionFinal          = SFinal.SED_Codigo,
            AlimentadorFinal          = P.ALIM_Interno,
            AlimentadorFinalEtiqueta  = AFinal.ALIM_Etiqueta
        FROM Postes P
        LEFT JOIN Seds SFinal
            ON SFinal.SED_Interno = P.POST_Subestacion
        LEFT JOIN Alimentadores AFinal
            ON AFinal.ALIM_Interno = P.ALIM_Interno
        WHERE P.POST_EsBT = 1
          AND P.POST_CodigoNodo = @COD_POS_OR_VAN;
    END;

    IF @EXISTE_VANO > 0
    BEGIN
        SELECT
            TipoElemento              = 'VANO',
            IdInterno                 = V.VANO_Interno,
            CodigoElemento            = V.VANO_Codigo,
            SubestacionFinal          = SFinal.SED_Codigo,
            AlimentadorFinal          = V.ALIM_Interno,
            AlimentadorFinalEtiqueta  = AFinal.ALIM_Etiqueta
        FROM Vanos V
        LEFT JOIN Seds SFinal
            ON SFinal.SED_Interno = V.VANO_Subestacion
        LEFT JOIN Alimentadores AFinal
            ON AFinal.ALIM_Interno = V.ALIM_Interno
        WHERE V.VANO_EsBT = 1
          AND V.VANO_Codigo = @COD_POS_OR_VAN;
    END;

    PRINT 'REVISA LOS RESULTADOS.';
    PRINT 'SI ESTA BIEN, EJECUTA: COMMIT TRAN;';
    PRINT 'SI ESTA MAL, EJECUTA: ROLLBACK TRAN;';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    THROW;
END CATCH;


rollback
--commit