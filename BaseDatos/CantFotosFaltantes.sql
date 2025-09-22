select d.DEFI_Interno, a.ARCH_Tabla, a.ARCH_CodTabla,SUBSTRING(ARCH_Nombre,1,LEN(ARCH_Nombre)-1),count(a.ARCH_Interno)
from Deficiencias as d
join Archivos as a on a.ARCH_CodTabla = d.DEFI_Interno
where d.DEFI_EstadoSubsanacion <> 'O'
group by a.ARCH_Tabla, a.ARCH_CodTabla,SUBSTRING(ARCH_Nombre,1,LEN(ARCH_Nombre)-1), d.DEFI_Interno
Having count(a.ARCH_Interno)<4