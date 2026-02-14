/*==============================================================================
  BORRAR TODAS LAS DEFICIENCIAS DE UN ELEMENTO
  (opcional) Al eliminar una deficiencia tambien se borran sus registros
==============================================================================*/

----------------------------------------------------------------------
-- CONSULTAR DEFICIENCIAS QUE SE ELIMINARÁN
----------------------------------------------------------------------

DECLARE @CODIGO VARCHAR(50) = '0111434';

SELECT COUNT(*) 
FROM Deficiencias AS D
LEFT JOIN Postes AS P 
	ON D.DEFI_TipoElemento = 'POST' 
	AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos AS V
	ON D.DEFI_TipoElemento = 'VANO' 
	AND D.DEFI_IdElemento = V.VANO_Interno
WHERE D.DEFI_CodigoElemento like '%' + @CODIGO + '%'
	OR D.DEFI_CodigoElemento = @CODIGO

SELECT * 
FROM Deficiencias AS D
LEFT JOIN Postes AS P 
	ON D.DEFI_TipoElemento = 'POST' 
	AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos AS V
	ON D.DEFI_TipoElemento = 'VANO' 
	AND D.DEFI_IdElemento = V.VANO_Interno
WHERE D.DEFI_CodigoElemento like '%' + @CODIGO + '%'
	OR D.DEFI_CodigoElemento = @CODIGO;
GO


----------------------------------------------------------------------
-- BORRAR DEFICIENCIAS DE UN ELEMENTO
----------------------------------------------------------------------


DECLARE @CODIGO VARCHAR(50) = '0111434';

BEGIN TRAN;

SELECT @@ROWCOUNT AS [Filas antes de eliminar]

DELETE D
FROM Deficiencias AS D
LEFT JOIN Postes AS P 
    ON D.DEFI_TipoElemento = 'POST' 
   AND D.DEFI_IdElemento = P.POST_Interno
LEFT JOIN Vanos AS V
    ON D.DEFI_TipoElemento = 'VANO' 
   AND D.DEFI_IdElemento = V.VANO_Interno
WHERE D.DEFI_CodigoElemento like '%' + @CODIGO + '%'
   OR D.DEFI_CodigoElemento = @CODIGO;
   
SELECT @@ROWCOUNT AS [Filas eliminadas];



--COMMIT;
 ROLLBACK;

