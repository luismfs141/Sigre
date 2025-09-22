Create or Alter procedure sp_corregir_pozos (
@feeder int
)as 
begin
Select Ar.ARCH_Nombre,Ar.ARCH_CodTabla, 
REPLACE( REPLACE(Ar.ARCH_Nombre,'Deficiencias/SED/','Sin Deficiencias/'),Convert(varchar, Ar.ARCH_CodTabla) +'/2086/','') as Corregido
from Alimentadores A
join Deficiencias D on A.ALIM_Codigo = D.DEFI_CodAMT
join Archivos Ar on D.DEFI_Interno = Ar.ARCH_CodTabla
where A.ALIM_Interno = @feeder and D.DEFI_Estado = 'O' and Ar.ARCH_Nombre like '%/Deficiencias/%'
end
go