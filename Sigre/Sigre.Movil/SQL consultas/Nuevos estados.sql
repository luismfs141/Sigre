select * from EstadosGlobal

INSERT INTO EstadosGlobal
(ESGO_Nombre,
ESGO_Color,
ESGO_Descripcion,
ESGO_Tabla,
ESGO_Activo)
VALUES
('APROBADO','VERDE',NULL,'Deficiencias',1),
('OBSERVADO','AMARILLO',NULL,'Deficiencias',1)
GO


select * from Deficiencias where 