create table Usuarios
(
USUA_Interno int primary key identity(1,1),
USUA_Nombres varchar(50),
USUA_Apellidos varchar(50),
USUA_Imei varchar(20),
ALIM_Interno int null,

constraint fk_USUA_ALIM foreign key(ALIM_Interno) References Alimentadores(ALIM_Interno)
)

Insert into Usuarios
	(USUA_Nombres,USUA_Apellidos,USUA_Imei,ALIM_Interno)
values
	('Admin','','123456789',null)
