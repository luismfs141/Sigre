/*==============================================================================
  BORRAR TODAS DEFICIENCIAS DE UNA SUBESTACIÓN
  (opcional) Al eliminar una deficiencia tambien se borran sus registros
==============================================================================*/

----------------------------------------------------------------------
-- CONSULTAR DEFICIENCIAS QUE SE ELIMINARÁN
----------------------------------------------------------------------

DECLARE @SED_CODIGO VARCHAR(50) = '1459';

SELECT COUNT(*) AS TotalAEliminar
FROM Deficiencias D
LEFT JOIN Postes P ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos  V ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds  S ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo like '%' + @SED_CODIGO + '%'
	OR S.SED_Codigo = @SED_CODIGO

SELECT * 
FROM Deficiencias D
LEFT JOIN Postes P ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos  V ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds  S ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo like '%' + @SED_CODIGO + '%'
	OR S.SED_Codigo = @SED_CODIGO;
GO




----------------------------------------------------------------------
-- BORRAR DEFICIENCIAS DE UNA SED
----------------------------------------------------------------------

DECLARE @SED_CODIGO VARCHAR(50) = '2755';

BEGIN TRAN;

SELECT @@ROWCOUNT AS [Filas antes de eliminar]

DELETE D
FROM Deficiencias D
LEFT JOIN Postes P ON D.DEFI_TipoElemento = 'POST' AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos  V ON D.DEFI_TipoElemento = 'VANO' AND D.DEFI_IdElemento = V.VANO_Interno
INNER JOIN Seds  S ON S.SED_Interno = COALESCE(P.POST_Subestacion, V.VANO_Subestacion)
WHERE S.SED_Codigo like '%' + @SED_CODIGO + '%'
	OR S.SED_Codigo = @SED_CODIGO;

SELECT @@ROWCOUNT AS [Filas eliminadas];



--COMMIT;
 ROLLBACK;
