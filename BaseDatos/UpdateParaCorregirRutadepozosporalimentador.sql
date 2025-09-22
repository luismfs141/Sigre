/*Update para corregir ruta de pozos a tierra por alimentador por codigo */
update Ar
set Ar.ARCH_Nombre = t.Corregido
from Archivos Ar join (
Select Ar.ARCH_Nombre,Ar.ARCH_CodTabla,Ar.ARCH_Interno,
REPLACE( REPLACE(Ar.ARCH_Nombre,'Deficiencias/SED/','Sin Deficiencias/'),Convert(varchar, Ar.ARCH_CodTabla) +'/2086/','') as Corregido
from Alimentadores A
join Deficiencias D on A.ALIM_Codigo = D.DEFI_CodAMT
join Archivos Ar on D.DEFI_Interno = Ar.ARCH_CodTabla
where A.ALIM_Interno in (1,7,19,23,24,14 )  and D.DEFI_Estado = 'O' and Ar.ARCH_Nombre like '%/Deficiencias/%'
) as t on t.ARCH_Interno = Ar.ARCH_Interno
