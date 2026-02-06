

------------------------------------------------------------------
-- DEFICIENCIAS POR ALIMENTADOR ----------------------------------
------------------------------------------------------------------

SELECT	D.DEFI_Interno,
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
		END AS Criticidad,
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
		D.DEFI_Latitud,
		D.DEFI_Longitud,
		[***] = '',
		*
FROM Deficiencias AS D
LEFT JOIN Tipificaciones AS TI
	ON D.DEFI_Interno = TI.TIPI_Interno
LEFT JOIN Codigos AS CO
	ON TI.CODI_Interno = CO.CODI_Interno
LEFT JOIN Usuarios AS US
	ON D.DEFI_UsuarioInic = US.USUA_Interno

	select * from Deficiencias
	select * from Usuarios