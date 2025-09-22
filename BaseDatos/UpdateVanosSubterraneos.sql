Update V
Set 
	V.VANO_NodoInicial = VS.CodPintadoIni,
	V.VANO_NodoFinal = VS.CodPintadoFin,
	V.VANO_TipoMaterial = VS.Tipo,
	V.VANO_Terceros =	Case
							When VS.PROPIETARIO ='D' Then 0
							When VS.PROPIETARIO ='T' Then 1
						End,
	V.VANO_Subterraneo =Case
							When VS.Tipo like 'AL%' Then 0
							When VS.Tipo like 'CAA%' Then 0
							When VS.Tipo like 'CU%' Then 0
							When VS.Tipo like 'NA%' Then 0
							Else 1
						End	
From Vanos as V
Join	VanosSeal as VS on VS.[COD Vano] = V.VANO_Codigo