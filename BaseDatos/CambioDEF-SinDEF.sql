/*
CAMBIA ESTADO DE DEFICIENCIA A SIN DEFICIENCIA
*/

Update Deficiencias
set DEFI_Estado = 'O',INSP_Interno = Null, TABL_Interno = NULL,TIPI_Interno = NULL,
					DEFI_FechaDenuncia = NULL, DEFI_FechaInspeccion = null,DEFI_FechaSubsanacion=null,
					DEFI_EstadoSubsanacion = null, DEFI_DistHorizontal = null, DEFI_DistVertical = null, DEFI_DistTransversal= null,DEFI_FechaCreacion = null
where DEFI_Interno in (46874) --INGRESAR DEFI_INTERNO

/*
MODIFICACION DE NOMBRE DE ARCHIVO A SIN DEFICIENCIAS
*/

Update ar
set ar.ARCH_Nombre = a.RouteSinDef
From Archivos as ar
Join(
Select a.ARCH_Interno, a.ARCH_Nombre RouteDEF, case
																when a.ARCH_Nombre like '%POST%'
																Then
																	REPLACE(SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.arch_nombre) + 1) + 1) + 1) - 1)
																			,'Deficiencias/POST','Sin Deficiencias')+SUBSTRING(a.ARCH_Nombre,LEN(a.ARCH_NOmbre)-1,LEN(a.ARCH_NOmbre))
																when a.ARCH_Nombre like '%VANO%'
																Then
																	REPLACE(SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.arch_nombre) + 1) + 1) + 1) - 1)
																			,'Deficiencias/VANO','Sin Deficiencias')+SUBSTRING(a.ARCH_Nombre,LEN(a.ARCH_NOmbre)-1,LEN(a.ARCH_NOmbre))
																else
																	REPLACE(SUBSTRING(a.ARCH_Nombre,1,CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.ARCH_Nombre, CHARINDEX('/', a.arch_nombre, CHARINDEX('/', a.arch_nombre) + 1) + 1) + 1) - 1)
																			,'Deficiencias/SED','Sin Deficiencias')+SUBSTRING(a.ARCH_Nombre,LEN(a.ARCH_NOmbre)-1,LEN(a.ARCH_NOmbre))
																End RouteSinDef
from Deficiencias as d
join Archivos as a on a.ARCH_CodTabla = d.DEFI_Interno and d.DEFI_Interno in (46874) --INGRESAR DEFI INTERNO
) as a on a.ARCH_Interno = ar.ARCH_Interno