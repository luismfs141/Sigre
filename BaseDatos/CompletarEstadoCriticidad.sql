Update Deficiencias
set DEFI_EstadoCriticidad = 2
Where TIPI_Interno is not null and DEFI_EstadoCriticidad is null and TIPI_Interno in (4,18,38,36,42)

Update Deficiencias
set DEFI_EstadoCriticidad = 1
where TIPI_Interno is not null and DEFI_EstadoCriticidad is null