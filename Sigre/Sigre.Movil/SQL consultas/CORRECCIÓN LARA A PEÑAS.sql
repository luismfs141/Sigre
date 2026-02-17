-------------------------------------------------
-- PARTE 1
-------------------------------------------------

begin transaction


-------------------------------------------------
-- PARTE 2
-------------------------------------------------

BEGIN TRY
    BEGIN TRAN;

    -- (Opcional) Vista previa
    SELECT COUNT(*) AS TotalAActualizar
    FROM dbo.Postes
    WHERE ALIM_Interno = 5
      AND POST_CodigoNodo IN (
        'PTO000039097','PTO000039098','PTO000039099','PTO000039100',
        'PTO000039149','PTO000039150','PTO000039151',
        'PTO000074917','PTO000074918','PTO000074919','PTO000074920','PTO000074921','PTO000074922','PTO000074923',
        'PTO000074924','PTO000074925','PTO000074926','PTO000074927','PTO000074928','PTO000074929','PTO000074930',
        'PTO000074931','PTO000074932','PTO000074933','PTO000074934','PTO000074935','PTO000074936',
        'PTO000079682',
        'PTO000115231','PTO000115232','PTO000115233','PTO000115234','PTO000115235','PTO000115236','PTO000115237',
        'PTO000115238','PTO000115239','PTO000115240','PTO000115241',
        'PTO000134485','PTO000134486',
        'PTO000144074',
        'PTO000148859',
        'PTO000179655',
        'PTO000191471','PTO000191472'
      );

    UPDATE dbo.Postes
    SET ALIM_Interno = 106
    WHERE ALIM_Interno = 5
      AND POST_CodigoNodo IN (
        'PTO000039097','PTO000039098','PTO000039099','PTO000039100',
        'PTO000039149','PTO000039150','PTO000039151',
        'PTO000074917','PTO000074918','PTO000074919','PTO000074920','PTO000074921','PTO000074922','PTO000074923',
        'PTO000074924','PTO000074925','PTO000074926','PTO000074927','PTO000074928','PTO000074929','PTO000074930',
        'PTO000074931','PTO000074932','PTO000074933','PTO000074934','PTO000074935','PTO000074936',
        'PTO000079682',
        'PTO000115231','PTO000115232','PTO000115233','PTO000115234','PTO000115235','PTO000115236','PTO000115237',
        'PTO000115238','PTO000115239','PTO000115240','PTO000115241',
        'PTO000134485','PTO000134486',
        'PTO000144074',
        'PTO000148859',
        'PTO000179655',
        'PTO000191471','PTO000191472'
      );

    SELECT @@ROWCOUNT AS FilasActualizadas;

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;


-------------------------------------------------
-- PARTE 3
-------------------------------------------------

-- SQL Server
-- Cambia ALIM_Interno de 5 -> 106 solo para los Vanos cuyo VANO_Codigo esté en la lista

BEGIN TRY
    BEGIN TRAN;

    -- (Opcional) Vista previa
    SELECT COUNT(*) AS TotalAActualizar
    FROM dbo.Vanos
    WHERE ALIM_Interno = 5
      AND VANO_Codigo IN (
        'VBT000092836',
        'VBT000092837',
        'VBT000092838',
        'VBT000092839',
        'VBT000092840',
        'VBT000092841',
        'VBT000092842'
      );

    UPDATE dbo.Vanos
    SET ALIM_Interno = 106
    WHERE ALIM_Interno = 5
      AND VANO_Codigo IN (
        'VBT000092836',
        'VBT000092837',
        'VBT000092838',
        'VBT000092839',
        'VBT000092840',
        'VBT000092841',
        'VBT000092842'
      );

    SELECT @@ROWCOUNT AS FilasActualizadas;

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;

-------------------------------------------------
-- PARTE 4
-------------------------------------------------

UPDATE A
SET A.ARCH_Nombre = REPLACE(A.ARCH_Nombre,  N'LARA/3689', N'PE+ÆAS/3689')
FROM Archivos A
WHERE ARCH_Nombre LIKE N'%LARA/3689%'
  AND A.ARCH_Fecha >= '2026-02-09T00:00:00'
  AND A.ARCH_Fecha <  '2026-02-10T00:00:00';


-------------------------------------------------
-- PARTE 5 - DEPENDIENDO
-------------------------------------------------

rollback
--commit
