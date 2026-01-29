------------------------------------------------------------------
-- MANDAR POSTES A TERCEROS -----------------------------------
------------------------------------------------------------------
BEGIN TRANSACTION

update Postes 
Set POST_Terceros = 1
where POST_CodigoNodo in (
'',
''

	)
GO

ROLLBACK
--COMMIT


------------------------------------------------------------------
-- MANDAR VANOS A TERCEROS ---------------------------------------
------------------------------------------------------------------
BEGIN TRANSACTION

update Vanos 
Set VANO_Terceros = 1
where VANO_Codigo in (
'',
''


	)
GO

ROLLBACK
--COMMIT