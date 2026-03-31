
/*==============================================================================
  DEFICIENCIAS Y ARCHIVOS DE UN ELEMENTO
  (opcional) Descripción corta / objetivo
==============================================================================*/

DECLARE @CODIGO VARCHAR(20) = 'VBT000275162'


------------------------------------------------------------
--  DEFICIENCIAS DE UN ELEMETNO
------------------------------------------------------------



SELECT	D.DEFI_Interno,
		D.DEFI_Activo,
		D.DEFI_TipoElemento,
		AL.ALIM_Etiqueta AS [Alim x SED],
		AL2.ALIM_Etiqueta AS [Alim x Element],
		SE.SED_Codigo,
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
LEFT JOIN Postes AS PO
	ON D.DEFI_IdElemento = PO.POST_Interno
LEFT JOIN Vanos AS VA
	ON D.DEFI_IdElemento = VA.VANO_Interno
LEFT JOIN Seds AS SE
	ON VA.VANO_Subestacion = SE.SED_Interno
	OR PO.POST_Subestacion = SE.SED_Interno
LEFT JOIN Alimentadores AS AL
	ON SE.ALIM_Interno = AL.ALIM_Interno
LEFT JOIN Alimentadores AS AL2
	ON PO.ALIM_Interno = AL2.ALIM_Interno
	OR VA.ALIM_Interno = AL2.ALIM_Interno
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


