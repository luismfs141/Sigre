begin transaction


SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CodigosOpciones]
(
    [CODOP_Interno] INT IDENTITY(1,1) NOT NULL,
    [CODI_Interno]  INT NOT NULL,
    [CODOP_Opcion]  NVARCHAR(60) NOT NULL,
    [CODOP_Col1]    NVARCHAR(60) NULL,
    [CODOP_Col2]    NVARCHAR(60) NULL,

    CONSTRAINT [PK_CodigosOpciones]
        PRIMARY KEY CLUSTERED ([CODOP_Interno] ASC),

    CONSTRAINT [FK_CodigosOpciones_Codigos]
        FOREIGN KEY ([CODI_Interno])
        REFERENCES [dbo].[Codigos] ([CODI_Interno])
);
GO

CREATE INDEX [IX_CodigosOpciones_CODI_Interno]
ON [dbo].[CodigosOpciones] ([CODI_Interno])
GO





INSERT INTO dbo.CodigosOpciones
(
    CODI_Interno,
    CODOP_Opcion
)
VALUES
(40, N'Fierro expuesto'),
(40, N'Desprendimiento de cemento'),
(40, N'Poste fisurado'),
(40, N'Grietas profundas'),
(41, N'Cimentacion expuesta'),
(41, N'Inclinado mas de 5°'),
(42, N'CP con tapa abierta'),
(42, N'CP sin tapa'),
(43, N'PM rota'),
(43, N'PM inexistente'),
(43, N'PM menor a 2.4m'),
(43, N'PM de material inapropiado'),
(44, N'Retenida rota'),
(44, N'Retenida destensada'),
(44, N'Retenida presenta oxidacion'),
(45, N'Pastoral holgado'),
(45, N'Pastoral CAC roto'),
(45, N'Pastoral CAC con fisuras'),
(45, N'Pastoral metálico oxidado'),
(45, N'Abrazadera fijado con cuñas'),
(45, N'Abrazadera con alambres'),
(45, N'Fijado con cintas bandit'),
(46, N'AAP por desprenderse'),
(46, N'AAP desprendido'),
(46, N'AAP con malos elementos de fijacion'),
(47, N'Autoportante empalmado'),
(47, N'CPI empalmado'),
(47, N'Aislamiento deteriorado'),
(48, N'Cerca a edificación'),
(48, N'Sobre edificación'),
(48, N'En contacto con vivienda'),
(49, N'Sin DMS vertical (calle/camino)'),
(49, N'Sin DMS vertical (longitudinal a piso)'),
(49, N'Sin DMS vertical (cochera)'),
(49, N'Sin DMS vertical (avenida/carretera)'),
(49, N'Sin DMS vertical (vía férrea)'),
(50, N'Sin DMS horizontal a grifo');





ALTER TABLE [dbo].[Deficiencias]
ADD [CODOP_Interno] [int] NULL
GO



rollback




