Alter Table Vanos 
add 
	VANO_TipoMaterial nvarchar(60) null,
	VANO_NodoInicial nvarchar(24) null,
	VANO_NodoFinal nvarchar(24) null,
	VANO_Subterraneo bit not null default 0,
	VANO_Inspeccionado bit not null default 0

Alter Table Postes 
add 
	POSTE_Altura integer,
	POSTE_TipoMaterial varchar(3),
	POSTE_Inspeccionado bit not null default 0

Alter Table Seds 
add 
	SED_Altura integer,
	SED_TipoMaterial varchar(3),
	SED_Inspeccionado bit not null default 0
	

Update D
Set 
	D.DEFI_UsuarioInic = CONVERT(varchar(30),U.USUA_Interno),
	D.DEFI_UsuarioMod = CONVERT(varchar(30),U.USUA_Interno)
From Deficiencias as D
Join Usuarios as U on U.USUA_Imei = isnull(D.DEFI_UsuarioMod, D.DEFI_UsuarioInic)

Update Deficiencias
Set DEFI_UsuarioInic =	Case 
							When LEN(DEFI_UsuarioInic)>2 Then '1'
							When DEFI_UsuarioInic = '' Then '0'
							else DEFI_UsuarioInic
						End,
	DEFI_UsuarioMod =	Case 
							When LEN(DEFI_UsuarioMod)>2 Then '1'
							When DEFI_UsuarioMod = '' Then '0'
							else DEFI_UsuarioMod
						End

ALTER TABLE Deficiencias DROP Constraint DF__Deficienc__DEFI___3E52440B -- Revisar en Nube para eliminar
ALTER TABLE Deficiencias DROP Constraint DF__Deficienc__DEFI___3F466844 -- Revisar en Nube para eliminar

Alter Table Deficiencias Alter Column DEFI_UsuarioInic int null 
Alter Table Deficiencias Alter Column DEFI_UsuarioMod int null

Alter Table 
	Deficiencias 
add 
	DEFI_FecEliminacion DateTime,
	DEFI_Inspeccion bit not null default 0

Select * from Vanos