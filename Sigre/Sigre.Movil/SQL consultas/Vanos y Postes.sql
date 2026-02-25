--------------------------------
-- POSTES ----------------------
--------------------------------
DECLARE @codigo varchar(50) = '%0111434%';
DECLARE @alimentador varchar(50) = 'TECSUP';

SELECT
    a.ALIM_Etiqueta,
    P.POST_Etiqueta,
    pm.POSMT_Nombre,
    rt.RTNTP_Nombre,
    P.POST_Altura,
    POST_Terceros,
    [***] = '',
    p.*
FROM dbo.Postes p
LEFT JOIN dbo.Alimentadores as a
    ON a.ALIM_Interno = p.ALIM_Interno
LEFT JOIN dbo.PosteMaterial as pm
    on p.POST_Material = pm.POSMT_Interno
LEFT JOIN dbo.RetenidaTipo as rt
    on p.POST_RetenidaTipo = rt.RTNTP_Interno
WHERE p.POST_CodigoNodo LIKE @codigo
    AND a.ALIM_Etiqueta = @alimentador
    AND p.POST_EsBT = 1;
GO


--------------------------------
-- VANOS -----------------------
--------------------------------
DECLARE @VanoCodigo varchar(50) = 'VBT000104754';
DECLARE @alimentador varchar(50) = 'mejia';
SELECT
    v.VANO_Codigo,
    v.VANO_NodoInicial,
    v.VANO_NodoFinal,
    [***] = '',
    v.*
FROM dbo.Vanos v
LEFT JOIN DBO.Alimentadores AS A
    ON A.ALIM_Interno = V.ALIM_Interno
WHERE v.VANO_Codigo like @VanoCodigo
    AND V.VANO_EsBT = 1
    AND A.ALIM_Etiqueta = @alimentador


    select * from Vanos where VANO_Subestacion = '1712' order by 2


    


--------------------------------



------------------------------------------------------------------
-- BUSCAR TODOS LOS ELEMENTOS DE UNA SUBESTACIÓN -----------------
------------------------------------------------------------------

DECLARE @SUB_ETI VARCHAR(20) = '%2755%'-- <-- tu SED_Codigo
(
    SELECT  
            ALI.ALIM_Interno AS [Id Alimentador],
            ALI.ALIM_Etiqueta AS [Etiqueta alimentador],
            S.SED_Interno AS [ID Sub Interno],
            S.SED_Etiqueta AS [Etiqueta Sub],
            Elemento = 'Poste',
            P.POST_Interno AS [ID Elemento interno],
            P.POST_Etiqueta AS [Etiqueta elemento],
            p.POST_CodigoNodo as cod
        
    FROM Postes AS P
    LEFT JOIN Seds AS S
        ON P.POST_Subestacion = S.SED_Interno
    LEFT JOIN Alimentadores AS ALI
        ON P.ALIM_Interno = ALI.ALIM_Interno
    WHERE S.SED_Etiqueta LIKE @SUB_ETI


    union all


    SELECT  ALI.ALIM_Interno AS [Id Alimentador],
            ALI.ALIM_Etiqueta AS [Etiqueta alimentador],
            S.SED_Interno AS [ID Sub Interno],
            S.SED_Etiqueta AS [Etiqueta Sub],
            Elemento = 'Vano',
            V.VANO_Interno AS [ID Interno],
            V.VANO_Codigo [Etiqueta],
            v.VANO_Codigo as cod
    FROM Vanos AS V
    LEFT JOIN Seds AS S
        ON V.VANO_Subestacion = S.SED_Interno
    LEFT JOIN Alimentadores AS ALI
        ON V.ALIM_Interno = ALI.ALIM_Interno

    WHERE S.SED_Etiqueta LIKE @SUB_ETI
)
ORDER BY 6







------------------------------------------------------------------
-- BUSCA UN POSTE ------------------------------------------------
------------------------------------------------------------------
DECLARE @CODIGO VARCHAR(20) = 'PTO000046761'

SELECT  P.POST_Interno,
        P.POST_Etiqueta,
        A.ALIM_Etiqueta,
        PM.POSMT_Nombre,
        RT.RTNTP_Nombre,
        P.POST_Altura,
        P.POST_Terceros,
        P.POST_Inspeccionado,
        [***] = '',
        p.*
FROM Postes AS P
LEFT JOIN Alimentadores AS A
    ON P.ALIM_Interno = A.ALIM_Interno
LEFT JOIN PosteMaterial AS PM
    ON P.POST_Material = PM.POSMT_Interno
LEFT JOIN RetenidaTipo AS RT
    ON P.POST_RetenidaTipo = RT.RTNTP_Interno
WHERE P.POST_CodigoNodo LIKE '%' + @CODIGO
    OR P.POST_CodigoNodo = @CODIGO
GO

------------------------------------------------------------------
-- BUSCA UN VANO ------------------------------------------------
------------------------------------------------------------------
DECLARE @CODIGO VARCHAR(20) = '033052'

SELECT  V.VANO_Interno,
        V.VANO_Codigo,
        A.ALIM_Etiqueta,
        V.VANO_NodoInicial,
        V.VANO_NodoFinal,
        VANO_Terceros,
        V.VANO_Inspeccionado,
        [***] = '',
        V.*
FROM Vanos AS V
LEFT JOIN Alimentadores AS A
    ON V.ALIM_Interno = A.ALIM_Interno

WHERE V.VANO_Codigo LIKE '%' + @CODIGO
    OR V.VANO_Codigo = @CODIGO
GO




------------------------------------------------------------------
-- BUSCA UN VANO ------------------------------------------------
------------------------------------------------------------------
DECLARE @CODIGO VARCHAR(20) = '033052'

SELECT  V.VANO_Interno,
        V.VANO_Codigo,
        A.ALIM_Etiqueta,
        V.VANO_NodoInicial,
        V.VANO_NodoFinal,
        VANO_Terceros,
        [***] = '',
        V.*
FROM Vanos AS V
LEFT JOIN Alimentadores AS A
    ON V.ALIM_Interno = A.ALIM_Interno

WHERE V.VANO_Codigo LIKE '%' + @CODIGO
    OR V.VANO_Codigo = @CODIGO
GO





------------------------------------------------------------------
-- BORRAR DEFICIENCIAS MASIVO ------------------------------------
------------------------------------------------------------------
BEGIN TRANSACTION

DELETE FROM Deficiencias
WHERE DEFI_Interno IN 
(

)

ROLLBACK





------------------------------------------------------------------
------------------------------------------------------------------
------------------------------------------------------------------




------------------------------------------------------------------
------------------------------------------------------------------
------------------------------------------------------------------



------------------------------------------------------------------
------------------------------------------------------------------
------------------------------------------------------------------



















