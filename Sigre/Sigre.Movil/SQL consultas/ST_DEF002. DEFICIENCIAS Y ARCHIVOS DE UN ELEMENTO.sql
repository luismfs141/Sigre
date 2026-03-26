
/*==============================================================================
  DEFICIENCIAS Y ARCHIVOS DE UN ELEMENTO
  (opcional) Descripción corta / objetivo
==============================================================================*/

DECLARE @CODIGO VARCHAR(20) = 'PTO000133506'


------------------------------------------------------------
--  DEFICIENCIAS DE UN ELEMETNO
------------------------------------------------------------



SELECT	D.DEFI_Interno,
		D.DEFI_Activo,
		D.DEFI_TipoElemento,
		D.DEFI_CodigoElemento,
		CO.CODI_Codigo,
		
		
		CASE
			WHEN D.DEFI_EstadoCriticidad = 1 THEN 'Leve'
			WHEN D.DEFI_EstadoCriticidad = 2 THEN 'Moderado'
			WHEN D.DEFI_EstadoCriticidad = 3 THEN 'Critico'
		END AS Criticidad,
		D.DEFI_Col2 AS Responsabilidad,
		D.DEFI_NumSuministro,
		D.DEFI_DistHorizontal,
		CASE
			WHEN D.DEFI_Accesibilidad = 1 THEN 'Accesible'
			WHEN D.DEFI_Accesibilidad = 2 THEN 'No accesible'
		END AS Accesibilidad,
		CASE
			WHEN D.DEFI_TipoCruce = 1 THEN 'Calle'
			WHEN D.DEFI_TipoCruce = 2 THEN 'Avenida'
			WHEN D.DEFI_TipoCruce = 3 THEN 'Cruce de trenes'
			WHEN D.DEFI_TipoCruce = 4 THEN 'Longitudinal un piso'
			WHEN D.DEFI_TipoCruce = 5 THEN 'Longitudinal cochera'
		END AS [Tipo de cruce],
		D.DEFI_DistVertical,
		D.DEFI_Observacion,
		D.DEFI_Comentario,
		D.DEFI_FechaCreacion,
		US.USUA_Nombres + ' ' + US.USUA_Apellidos AS [Isp. CREADOR],
		D.DEFI_FecModificacion,
		US2.USUA_Nombres + ' ' + US2.USUA_Apellidos AS [Isp. MODIFICADOR],
		D.DEFI_FecRegistro,
		D.DEFI_Latitud,
		D.DEFI_Longitud,
		D.DEFI_Inspeccionado,
		[***] = '',
		D.*
FROM Deficiencias AS D
LEFT JOIN Tipificaciones AS TI
	ON D.TIPI_Interno = TI.TIPI_Interno
LEFT JOIN Codigos AS CO
	ON TI.CODI_Interno = CO.CODI_Interno
LEFT JOIN Usuarios AS US
	ON D.DEFI_UsuarioInic = US.USUA_Interno
LEFT JOIN Usuarios AS US2
	ON D.DEFI_UsuarioMod = US2.USUA_Interno
WHERE D.DEFI_CodigoElemento LIKE '%'+@CODIGO
	OR D.DEFI_CodigoElemento = @CODIGO



------------------------------------------------------------
--  ARCHIVOS DEL ELEMENTO
------------------------------------------------------------


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
WHERE Q.DEFI_CodigoElemento LIKE '%'+@CODIGO
	OR Q.DEFI_CodigoElemento = @CODIGO
ORDER BY Q.ElementoEtiqueta DESC;
GO



--begin tran

--update Archivos
--set ARCH_Nombre = 'SIGRE.MOVIL/TECSUP/2755/POSTE/PTO000111434/0000/FOT-2755-PTO000111434-0000-20260320-121126-1.jpg'
--where ARCH_Interno = 399433	
--update Archivos
--set ARCH_Nombre = 'SIGRE.MOVIL/TECSUP/2755/POSTE/PTO000111434/0000/FOT-2755-PTO000111434-0000-20260320-121131-2.jpg'
--where ARCH_Interno = 399434	
--update Archivos
--set ARCH_Nombre = 'SIGRE.MOVIL/TECSUP/2755/POSTE/PTO000111434/0000/FOT-2755-PTO000111434-0000-20260320-121134-3.jpg'
--where ARCH_Interno = 399435	
--update Archivos
--set ARCH_Nombre = 'SIGRE.MOVIL/TECSUP/2755/POSTE/PTO000111434/0000/FOT-2755-PTO000111434-0000-20260320-121142-4.jpg'
--where ARCH_Interno = 399436	
--update Archivos
--set ARCH_Nombre = 'SIGRE.MOVIL/TECSUP/2755/POSTE/PTO000111434/0000/AUD-2755-PTO000111434-0000-20260320-121146-0.m4a'
--where ARCH_Interno = 399437	

--rollback
--commit





--SELECT	VA.VANO_Codigo AS CODIGO,
--		VA.ALIM_Interno,
--		ALI.ALIM_Etiqueta AS [ALIM SEGUN VANO],
--		VA.VANO_Subestacion,
--		SE.ALIM_Interno,
--		ALI2.ALIM_Etiqueta AS [ALIM SEGUN SED],
--		[***]='',
--		VA.* 
--FROM Vanos AS VA
--LEFT JOIN Alimentadores AS ALI
--	ON VA.ALIM_Interno = ALI.ALIM_Interno
--LEFT JOIN Seds AS SE
--	ON VA.VANO_Subestacion = SE.SED_Interno
--LEFT JOIN Alimentadores AS ALI2
--	ON SE.ALIM_Interno = ALI2.ALIM_Interno







--SELECT  VA.VANO_Codigo AS CODIGO,
--        VA.ALIM_Interno,
--        ALI.ALIM_Etiqueta AS [ALIM SEGUN VANO],
--        VA.VANO_Subestacion,
--        SE.ALIM_Interno,
--        ALI2.ALIM_Etiqueta AS [ALIM SEGUN SED],
--        [***] = '',
--        VA.*
--FROM Vanos AS VA
--LEFT JOIN Alimentadores AS ALI
--    ON VA.ALIM_Interno = ALI.ALIM_Interno
--LEFT JOIN Seds AS SE
--    ON VA.VANO_Subestacion = SE.SED_Interno
--LEFT JOIN Alimentadores AS ALI2
--    ON SE.ALIM_Interno = ALI2.ALIM_Interno
--WHERE ISNULL(LTRIM(RTRIM(ALI.ALIM_Etiqueta)), '') <> ISNULL(LTRIM(RTRIM(ALI2.ALIM_Etiqueta)), '');








--SELECT  VA.VANO_Codigo AS CODIGO,
--        VA.ALIM_Interno,
--        ALI.ALIM_Etiqueta AS [ALIM SEGUN VANO],
--        VA.VANO_Subestacion,
--        SE.ALIM_Interno,
--        ALI2.ALIM_Etiqueta AS [ALIM SEGUN SED],
--        [***] = '',
--        VA.*
--FROM Vanos AS VA
--LEFT JOIN Alimentadores AS ALI
--    ON VA.ALIM_Interno = ALI.ALIM_Interno
--LEFT JOIN Seds AS SE
--    ON VA.VANO_Subestacion = SE.SED_Interno
--LEFT JOIN Alimentadores AS ALI2
--    ON SE.ALIM_Interno = ALI2.ALIM_Interno
--WHERE ISNULL(VA.ALIM_Interno, -1) <> ISNULL(SE.ALIM_Interno, -1)
--	AND VA.VANO_EsBT = 1