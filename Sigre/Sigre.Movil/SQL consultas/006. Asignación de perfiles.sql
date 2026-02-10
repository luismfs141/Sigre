BEGIN TRY
    ------------------------------------------------------------
    -- 0️ INICIAR TRANSACCIÓN
    ------------------------------------------------------------
    BEGIN TRAN;

    ------------------------------------------------------------
    -- 1️ ELIMINAR CONSTRAINTS (FK y PK)
    ------------------------------------------------------------
    ALTER TABLE dbo.PerfilesUsuarios
        DROP CONSTRAINT FK_PerfilesUsuarios_Perfiles;

    ALTER TABLE dbo.PerfilesUsuarios
        DROP CONSTRAINT FK_PerfilUsuario_Usuario;

    ALTER TABLE dbo.PerfilesUsuarios
        DROP CONSTRAINT PK_PerfilesUsuarios;

    ------------------------------------------------------------
    -- 2️ ELIMINAR TODOS LOS REGISTROS
    --    (no se copian datos antiguos)
    ------------------------------------------------------------
    DELETE FROM dbo.PerfilesUsuarios;

    ------------------------------------------------------------
    -- 3️ ELIMINAR TABLA
    ------------------------------------------------------------
    DROP TABLE dbo.PerfilesUsuarios;

    ------------------------------------------------------------
    -- 4️ CREAR TABLA NUEVA CON IDENTITY
    ------------------------------------------------------------
    CREATE TABLE dbo.PerfilesUsuarios (
        PFUS_Interno INT IDENTITY(1,1) NOT NULL,
        PFUS_Usuario INT NOT NULL,
        PFUS_Perfil  INT NOT NULL,
        PFUS_Activo  BIT NOT NULL
    );

    ------------------------------------------------------------
    -- 5️ RECREAR PRIMARY KEY
    ------------------------------------------------------------
    ALTER TABLE dbo.PerfilesUsuarios
    ADD CONSTRAINT PK_PerfilesUsuarios
    PRIMARY KEY (PFUS_Interno);

    ------------------------------------------------------------
    -- 6️ RECREAR FOREIGN KEYS
    ------------------------------------------------------------
    ALTER TABLE dbo.PerfilesUsuarios
    ADD CONSTRAINT FK_PerfilUsuario_Usuario
    FOREIGN KEY (PFUS_Usuario)
    REFERENCES dbo.Usuarios (USUA_Interno);

    ALTER TABLE dbo.PerfilesUsuarios
    ADD CONSTRAINT FK_PerfilesUsuarios_Perfiles
    FOREIGN KEY (PFUS_Perfil)
    REFERENCES dbo.Perfiles (PERF_Interno);

    ------------------------------------------------------------
    -- 7️ INSERTAR DATOS BASE (SIN PFUS_Interno)
    ------------------------------------------------------------
    INSERT INTO dbo.PerfilesUsuarios (PFUS_Usuario, PFUS_Perfil, PFUS_Activo)
    VALUES
        (1, 1, 1),
        (2, 1, 1),
        (3, 4, 0),
        (4, 4, 1),
        (5, 4, 1),
        (6, 4, 1),
        (7, 4, 1),
        (8, 4, 1),
        (9, 4, 1),
        (10, 4, 1),
        (11, 4, 0),
        (12, 4, 1),
        (13, 4, 1);

    ------------------------------------------------------------
    -- 8️ CONFIRMAR TODO
    ------------------------------------------------------------
    COMMIT;

END TRY
BEGIN CATCH
    ------------------------------------------------------------
    -- ERROR → DESHACER TODO
    ------------------------------------------------------------
    ROLLBACK;

    SELECT
        ERROR_NUMBER()  AS ErrorNumber,
        ERROR_MESSAGE() AS ErrorMessage,
        ERROR_LINE()    AS ErrorLine;
END CATCH;
GO




BEGIN TRY
    ------------------------------------------------------------
    -- 1️ VERIFICAR SI EXISTEN CORREOS DUPLICADOS
    --    (si hay, se aborta para no romper datos)
    ------------------------------------------------------------
    IF EXISTS (
        SELECT 1
        FROM Usuarios
        GROUP BY USUA_Correo
        HAVING COUNT(*) > 1
    )
    BEGIN
        RAISERROR(
            'Existen correos duplicados en la tabla Usuarios. Corrija antes de crear el índice único.',
            16, 1
        );
        RETURN;
    END

    ------------------------------------------------------------
    -- 2️ VERIFICAR SI EL ÍNDICE YA EXISTE
    ------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'UX_Usuarios_Correo'
          AND object_id = OBJECT_ID('dbo.Usuarios')
    )
    BEGIN
        --------------------------------------------------------
        -- 3️ CREAR ÍNDICE ÚNICO SOBRE USUA_Correo
        --------------------------------------------------------
        CREATE UNIQUE INDEX UX_Usuarios_Correo
        ON dbo.Usuarios (USUA_Correo);
    END
    ELSE
    BEGIN
        PRINT 'El índice UX_Usuarios_Correo ya existe.';
    END

END TRY
BEGIN CATCH
    ------------------------------------------------------------
    -- MOSTRAR ERROR SI ALGO FALLA
    ------------------------------------------------------------
    SELECT
        ERROR_NUMBER()  AS ErrorNumber,
        ERROR_MESSAGE() AS ErrorMessage,
        ERROR_LINE()    AS ErrorLine;
END CATCH;




-----------------------------------------------------------------------------------------------------------------------------


-- Agrega POST_Altura solo si no existe
IF COL_LENGTH('dbo.Postes', 'POST_Altura') IS NULL
BEGIN
    ALTER TABLE dbo.Postes
    ADD POST_Altura NUMERIC(10,2) NULL;
END


-----------------------------------------------------------------------------------------------------------------------------------------------

-- POST_Tramo en Postes
IF COL_LENGTH('dbo.Postes', 'POST_Tramo') IS NULL
BEGIN
  ALTER TABLE dbo.Postes
  ADD POST_Tramo NVARCHAR(20) NULL;
END
GO

-- VANO_Tramo en Vanos
IF COL_LENGTH('dbo.Vanos', 'VANO_Tramo') IS NULL
BEGIN
  ALTER TABLE dbo.Vanos
  ADD VANO_Tramo NVARCHAR(20) NULL;
END
GO


----------------------------------------------------------------------------------------------


IF COL_LENGTH('dbo.Archivos', 'DEFI_UUID') IS NULL
BEGIN
    ALTER TABLE dbo.Archivos
    ADD DEFI_UUID VARCHAR(50) NULL;
END





---------------------------------------------------------------------------------------



IF COL_LENGTH('dbo.Deficiencias', 'DEFI_ComentarioEstandar') IS NULL
BEGIN
    ALTER TABLE dbo.Deficiencias
    ADD DEFI_ComentarioEstandar VARCHAR(30) NULL;
END




begin transaction




UPDATE d
SET d.DEFI_ComentarioEstandar =
  CASE CONVERT(VARCHAR(10), co.CODI_Codigo)
    WHEN '6002' THEN 'Poste mal conservado'
    WHEN '6004' THEN 'Inclinado/falla cimt'
    WHEN '6006' THEN 'Portafus energ expos'
    WHEN '6008' THEN 'Prot mec cable defic'
    WHEN '6024' THEN 'Retenida mal estado'
    WHEN '6026' THEN 'Past. AP inestab y/o roto'
    WHEN '6028' THEN 'Artefacto AP suelto'
    WHEN '7002' THEN 'Cond aisl deter/inad'
    WHEN '7004' THEN 'Cond BT s/techo/met'
    WHEN '7006' THEN 'Cond BT alt baja DS'
    WHEN '7008' THEN 'Cond BT cerca grifo'
  END
FROM Deficiencias d
LEFT JOIN Tipificaciones ti ON d.TIPI_Interno = ti.TIPI_Interno
LEFT JOIN Codigos co ON ti.CODI_Interno = co.CODI_Interno
WHERE CONVERT(VARCHAR(10), co.CODI_Codigo) IN ('6002','6004','6006','6008','6024','6026','6028','7002','7004','7006','7008')
  AND (d.DEFI_ComentarioEstandar IS NULL OR LTRIM(RTRIM(d.DEFI_ComentarioEstandar)) = '');

-- filas afectadas
SELECT @@ROWCOUNT AS FilasActualizadas;



rollback
--commit









select co.CODI_Codigo, d.DEFI_ComentarioEstandar,d.* 
from Deficiencias as d
left join Tipificaciones as ti
    on d.TIPI_Interno = ti.TIPI_Interno
left join Codigos as co
    on ti.CODI_Interno = co.CODI_Interno
order by co.CODI_Codigo desc


