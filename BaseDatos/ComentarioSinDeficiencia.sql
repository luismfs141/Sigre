alter table Deficiencias
alter Column TIPI_Interno
int null;

alter table Deficiencias
alter Column TABL_Interno
int null;

alter table Deficiencias
alter Column DEFI_FechaDenuncia
datetime null;

alter table Deficiencias
add DEFI_Comentario
varchar(80) null;