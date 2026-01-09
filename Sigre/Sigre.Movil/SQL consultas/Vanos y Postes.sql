------------------------------------------------------------------
-- BUSCA DEFICIENCIAS POR ETIQUETA DE ELEMENTO -------------------
------------------------------------------------------------------
DECLARE @etiqueta varchar(20) = '%27516%';
;WITH Q AS
(
    SELECT  ElementoEtiqueta =
            CASE d.DEFI_TipoElemento
                WHEN 'POST' THEN p.POST_Etiqueta
                WHEN 'VANO' THEN v.VANO_Codigo
                ELSE NULL
            END,
            d.*
    FROM dbo.Deficiencias d
    LEFT JOIN dbo.Postes p
        ON d.DEFI_TipoElemento = 'POST'
       AND d.DEFI_IdElemento   = p.POST_Interno
    LEFT JOIN dbo.Vanos v
        ON d.DEFI_TipoElemento = 'VANO'
       AND d.DEFI_IdElemento   = v.VANO_Interno
)
SELECT  DEFI_IdElemento,
        ElementoEtiqueta,
        DEFI_FechaCreacion,
        DEFI_TipoElemento,
        DEFI_Interno,
        DEFI_Observacion,
        DEFI_Comentario,
        DEFI_Activo,
        DEFI_DistHorizontal,
        DEFI_DistVertical,
        Q.*
FROM Q
WHERE ElementoEtiqueta LIKE @etiqueta
ORDER BY Q.DEFI_FechaCreacion DESC;
GO


------------------------------------------------------------------
-- BUSCA ARCHIVOS POR ETIQUETA DE ELEMENTO ----------------------
------------------------------------------------------------------
DECLARE @etiqueta varchar(20) = '00556';

;WITH Q AS
(
    SELECT
        ElementoEtiqueta =
            CASE a.ARCH_TipoElemento
                WHEN 'POST' THEN p.POST_Etiqueta
                WHEN 'VANO' THEN v.VANO_Etiqueta
                ELSE NULL
            END,
        a.*
    FROM dbo.Archivos AS a
    LEFT JOIN dbo.Postes AS p
        ON a.ARCH_TipoElemento = 'POST'
       AND a.ARCH_IdElemento   = p.POST_Interno
    LEFT JOIN dbo.Vanos AS v
        ON a.ARCH_TipoElemento = 'VANO'
       AND a.ARCH_IdElemento   = v.VANO_Interno
)
SELECT  Q.*
FROM Q
WHERE Q.ElementoEtiqueta LIKE @etiqueta
ORDER BY Q.ARCH_Fecha DESC;
GO



select * from Deficiencias order by DEFI_FechaCreacion desc




select DEFI_FechaCreacion,DEFI_Comentario,DEFI_Observacion,DEFI_Activo,* from Deficiencias
order by 1 desc




select * from Archivos order by ARCH_Fecha desc






select *
from Archivos
order by ARCH_Fecha desc


select * from Postes where POST_Etiqueta like '%057714%'

select * from Postes order by POST_Inspeccionado desc
select * from Vanos order by VANO_Inspeccionado desc

select * from ArmadoTipo

301329
247970

select DEFI_FechaCreacion,DEFI_Observacion,DEFI_Comentario,* from Deficiencias
order by 2 desc



select * from Postes
where POST_Etiqueta like '%011958%'












EXEC sp_columns 'Vanos';
