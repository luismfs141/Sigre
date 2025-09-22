create database Sigre
go

use Sigre
go

create table Postes
(
	POST_Interno int primary key identity(1,1)
,	POST_Etiqueta varchar(100) not null
,	POST_UtmX decimal(18, 11)
,	POST_UtmY decimal(18, 11)
)