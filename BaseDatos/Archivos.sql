Create table Archivos
(
	ARCH_Interno int primary key identity(1,1) not null,
	ARCH_Tipo char(1) not null,
	ARCH_Tabla varchar(50) not null,
	ARCH_CodTabla int not null,
	ARCH_Nombre varchar(150) not null,
	ARCH_Activo bit not null default(1),
);