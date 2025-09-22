Create table Alimentadores
(
	ALIM_Interno int primary key identity(1,1),
	ALIM_Nombre varchar(200) not null
);

Insert into Alimentadores (ALIM_Nombre)
values	('Alimentador1'),
		('Alimentador2')
