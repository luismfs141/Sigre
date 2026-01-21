
BEGIN TRAN;


UPDATE V
SET V.VANO_NodoInicial = P1.POST_Etiqueta
FROM Vanos AS V
LEFT JOIN Postes AS P1
    ON  V.VANO_LatitudIni  = ROUND(P1.POST_Latitud, 8)
    AND V.VANO_LongitudIni = ROUND(P1.POST_Longitud, 8)
WHERE
    V.VANO_EsBT = 1
    AND P1.POST_EsBt = 1
    AND V.VANO_NodoInicial IS NULL;


UPDATE V
SET V.VANO_NodoFinal = P2.POST_Etiqueta
FROM Vanos AS V
LEFT JOIN Postes AS P2
    ON  V.VANO_LatitudFin  = ROUND(P2.POST_Latitud, 8)
    AND V.VANO_LongitudFin = ROUND(P2.POST_Longitud, 8)
WHERE
    V.VANO_EsBT = 1
    AND P2.POST_EsBt = 1
   -- AND V.VANO_NodoFinal IS NULL;


ROLLBACK;
-- COMMIT;

