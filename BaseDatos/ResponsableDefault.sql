update Deficiencias
set DEFI_Responsable = 0

alter table Deficiencias
add constraint df_DEFI_Responsable
default 0 for DEFI_Responsable