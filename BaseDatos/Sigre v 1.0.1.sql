delete from Seds
dbcc checkident('Seds', reseed, 0)
alter table Seds add SED_Tipo char(1) not null

insert into Seds
		(	SED_Etiqueta,	SED_Latitud,	SED_Longitud,	SED_Tipo)

select		ETIQUETA,		Latitud,		Longitud,
			case 
				when SUBSTRING(Etiqueta,1,1) = 'P' then  'P'
				when SUBSTRING(SIMBOLO,3,1) = 'M' then 'M'
				when SUBSTRING(SIMBOLO,3,1) = 'B' then 'B'
				when SUBSTRING(SIMBOLO,3,1) = 'C' then 'C'
				else 'N'
			end
from		Subestaciones
