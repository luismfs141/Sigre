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

DECLARE @SUB_ETI VARCHAR(20) = '%8102%'-- <-- tu SED_Codigo
(
    SELECT  
            ALI.ALIM_Interno AS [Id Alimentador],
            ALI.ALIM_Etiqueta AS [Etiqueta alimentador],
            S.SED_Interno AS [ID Sub Interno],
            S.SED_Etiqueta AS [Etiqueta Sub],
            Elemento = 'Poste',
            P.POST_Interno AS [ID Elemento interno],
            P.POST_Etiqueta AS [Etiqueta elemento]
        
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
            V.VANO_Codigo [Etiqueta]
    FROM Vanos AS V
    LEFT JOIN Seds AS S
        ON V.VANO_Subestacion = S.SED_Interno
    LEFT JOIN Alimentadores AS ALI
        ON V.ALIM_Interno = ALI.ALIM_Interno

    WHERE S.SED_Etiqueta LIKE @SUB_ETI
)
ORDER BY [Etiqueta elemento]













------------------------------------------------------------------
-- BUSCA ARCHIVOS POR ETIQUETA DE ELEMENTO ----------------------
------------------------------------------------------------------

DECLARE @CodElemento varchar(20) = '%57734';

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
WHERE Q.DEFI_CodigoElemento LIKE @CodElemento
ORDER BY Q.ARCH_Fecha DESC;
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



















