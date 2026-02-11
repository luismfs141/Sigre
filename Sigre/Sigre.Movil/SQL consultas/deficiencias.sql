

------------------------------------------------------------------
-- DEFICIENCIAS POR ALIMENTADOR ----------------------------------
------------------------------------------------------------------

DECLARE @CODIGO VARCHAR(20) = 'PTO000001044'

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
		US.USUA_Nombres + ' ' + US.USUA_Apellidos AS [Isp. CREADOR],
		D.DEFI_FecModificacion,
		US2.USUA_Nombres + ' ' + US2.USUA_Apellidos AS [Isp. MODIFICADOR],
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
LEFT JOIN Usuarios AS US2
	ON D.DEFI_UsuarioMod = US2.USUA_Interno
WHERE D.DEFI_CodigoElemento LIKE '%'+@CODIGO
	OR D.DEFI_CodigoElemento = @CODIGO



------------------------------------------------------------------
-- BUSCA ARCHIVOS POR ETIQUETA DE ELEMENTO ----------------------
------------------------------------------------------------------


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
