alter table Postes add POST_CodigoNodo varchar(20)

delete from Postes
dbcc checkident('Postes', reseed,0)

insert into Postes
		(	POST_Etiqueta,	POST_Latitud,	POST_Longitud,	ALIM_Interno,	POST_CodigoNodo)
select		isnull(ETIQUETA, ''),		Latitud,		Longitud,		a.ALIM_Interno,	CODIGONODO
from		Sigre_Migra..Poste_	p
inner join	Alimentadores		a	on	p.FILTRO	=	a.ALIM_Codigo
where		isnumeric(latitud) = 1
