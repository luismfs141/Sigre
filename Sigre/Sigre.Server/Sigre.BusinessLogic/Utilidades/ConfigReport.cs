namespace Sigre.BusinessLogic.Utilidades
{
    public static class ConfigReport
    {
        public enum TipoFila
        {
            Alimentador,
            Fecha,
            Orden,
            NodoAnterior,
            NodoPosterior,
            TipoSubestacion,
            CodigoGis,
            Codigo,
            Altura,
            Armado,
            Material,
            Criticidad,
            Fotos,

            DEF1002 = 1,
            DEF1008 = 2,
            DEF1012 = 3,
            DEF1034 = 4,
            DEF1036 = 5,
            DEF1042 = 6,
            DEF1072 = 7,
            DEF1074 = 8,
            DEF1082 = 9,
            DEF1086 = 10,

            DEF2002 = 11,
            DEF2004 = 12,
            DEF2008 = 13,
            DEF2024 = 14,
            DEF2026 = 15,
            DEF2034 = 16,
            DEF2132 = 17,
            DEF2040 = 18,
            DEF2072 = 19,
            DEF2074 = 20,
            DEF2082 = 21,
            DEF2086 = 22,
            DEF2106 = 23,
            DEF2104 = 24,

            DEF5010 = 25,
            DEF5016 = 26,
            DEF5018 = 27,
            DEF5026 = 28,
            DEF5030 = 29,
            DEF5032 = 30,
            DEF5038 = 31,

            DEF3052 = 32,
            DEF3054 = 33,
            DEF3074 = 34,

            DEF4026 = 35,
            DEF4028 = 36,
            DEF4042 = 37,
            DEF4049 = 38,
            DEF4072 = 39
        }

        public class Fila
        {
            public TipoFila Tipo { get; set; }
            public int Numero { get; set; }
        }

        public class Elemento
        {
            public List<Fila> Datos { get; set; } = new();
            public List<Fila> Deficiencias { get; set; } = new();
        }

        public class Hoja
        {
            public string Nombre { get; set; } = string.Empty;

            public List<Fila> DatosGenerales { get; set; } = new();

            public Elemento Elemento { get; set; } = new();
        }

        public static readonly List<Hoja> Hojas = new()
        {
            new Hoja
            {
                Nombre = "VMT",

                DatosGenerales = new()
                {
                    new Fila { Tipo = TipoFila.Alimentador, Numero = 5 },
                    new Fila { Tipo = TipoFila.Fecha, Numero = 6 },
                    new Fila { Tipo = TipoFila.Orden, Numero = 7 }
                },

                Elemento = new Elemento
                {
                    Datos = new()
                    {
                        new Fila { Tipo = TipoFila.NodoAnterior, Numero = 8 },
                        new Fila { Tipo = TipoFila.NodoPosterior, Numero = 9 },
                        new Fila { Tipo = TipoFila.CodigoGis, Numero = 10 },
                        new Fila { Tipo = TipoFila.Criticidad, Numero = 18 },
                        new Fila { Tipo = TipoFila.Fotos, Numero = 19 }
                    },

                    Deficiencias = new()
                    {
                        new Fila { Tipo = TipoFila.DEF5010, Numero = 11 },
                        new Fila { Tipo = TipoFila.DEF5016, Numero = 12 },
                        new Fila { Tipo = TipoFila.DEF5018, Numero = 13 },
                        new Fila { Tipo = TipoFila.DEF5026, Numero = 14 },
                        new Fila { Tipo = TipoFila.DEF5030, Numero = 15 },
                        new Fila { Tipo = TipoFila.DEF5032, Numero = 16 },
                        new Fila { Tipo = TipoFila.DEF5038, Numero = 17 }
                    }
                }
            },

            new Hoja
            {
              Nombre = "NMT",

                DatosGenerales = new()
                {
                    new Fila { Tipo = TipoFila.Alimentador, Numero = 5 },
                    new Fila { Tipo = TipoFila.Fecha, Numero = 6 },
                    new Fila { Tipo = TipoFila.Orden, Numero = 7 }
                },

                Elemento = new Elemento
                {
                    Datos = new()
                    {
                        new Fila { Tipo = TipoFila.Codigo, Numero = 8 },
                        new Fila { Tipo = TipoFila.CodigoGis, Numero = 9 },
                        new Fila { Tipo = TipoFila.Altura, Numero = 10 },
                        new Fila { Tipo = TipoFila.Armado, Numero = 19 },
                        new Fila { Tipo = TipoFila.Material, Numero = 20 },
                        new Fila { Tipo = TipoFila.Criticidad, Numero = 28 },
                        new Fila { Tipo = TipoFila.Fotos, Numero = 29 }
                    },

                    Deficiencias = new()
                    {
                        new Fila { Tipo = TipoFila.DEF1002, Numero = 11 },
                        new Fila { Tipo = TipoFila.DEF1008, Numero = 12 },
                        new Fila { Tipo = TipoFila.DEF1012, Numero = 13 },
                        new Fila { Tipo = TipoFila.DEF1034, Numero = 15 },
                        new Fila { Tipo = TipoFila.DEF1036, Numero = 16 },
                        new Fila { Tipo = TipoFila.DEF1042, Numero = 17 },
                        new Fila { Tipo = TipoFila.DEF1072, Numero = 23 },
                        new Fila { Tipo = TipoFila.DEF1074, Numero = 24 },
                        new Fila { Tipo = TipoFila.DEF1082, Numero = 26 },
                        new Fila { Tipo = TipoFila.DEF1086, Numero = 27 }
                    }
                }
            },

            new Hoja
            {
              Nombre = "SED-A",

                DatosGenerales = new()
                {
                    new Fila { Tipo = TipoFila.Alimentador, Numero = 5 },
                    new Fila { Tipo = TipoFila.Fecha, Numero = 6 },
                    new Fila { Tipo = TipoFila.Orden, Numero = 7 }
                },

                Elemento = new Elemento
                {
                    Datos = new()
                    {
                        new Fila { Tipo = TipoFila.CodigoGis, Numero = 8 },
                        new Fila { Tipo = TipoFila.TipoSubestacion, Numero = 10 },
                        new Fila { Tipo = TipoFila.Altura, Numero = 11 },
                        new Fila { Tipo = TipoFila.Criticidad, Numero = 32 },
                        new Fila { Tipo = TipoFila.Fotos, Numero = 33 }
                    },

                    Deficiencias = new()
                    {
                        new Fila { Tipo = TipoFila.DEF2002, Numero = 12 },
                        new Fila { Tipo = TipoFila.DEF2004, Numero = 13 },
                        new Fila { Tipo = TipoFila.DEF2008, Numero = 15 },
                        new Fila { Tipo = TipoFila.DEF2024, Numero = 17},
                        new Fila { Tipo = TipoFila.DEF2026, Numero = 18 },
                        new Fila { Tipo = TipoFila.DEF2034, Numero = 19 },
                        new Fila { Tipo = TipoFila.DEF2132, Numero = 20 },
                        new Fila { Tipo = TipoFila.DEF2040, Numero = 22 },
                        new Fila { Tipo = TipoFila.DEF2072, Numero = 24 },
                        new Fila { Tipo = TipoFila.DEF2074, Numero = 25 },
                        new Fila { Tipo = TipoFila.DEF2082, Numero = 27 },
                        new Fila { Tipo = TipoFila.DEF2086, Numero = 28 },
                        new Fila { Tipo = TipoFila.DEF2106, Numero = 30 },
                        new Fila { Tipo = TipoFila.DEF2104, Numero = 31 }
                    }
                }
            },

            new Hoja
            {
              Nombre = "SED-C",

                DatosGenerales = new()
                {
                    new Fila { Tipo = TipoFila.Alimentador, Numero = 4 },
                    new Fila { Tipo = TipoFila.Fecha, Numero = 5 },
                    new Fila { Tipo = TipoFila.Orden, Numero = 6 }
                },

                Elemento = new Elemento
                {
                    Datos = new()
                    {
                        new Fila { Tipo = TipoFila.CodigoGis, Numero = 7 },
                        new Fila { Tipo = TipoFila.Criticidad, Numero = 13 },
                        new Fila { Tipo = TipoFila.Fotos, Numero = 14 }
                    },

                    Deficiencias = new()
                    {
                        new Fila { Tipo = TipoFila.DEF3052, Numero = 9 },
                        new Fila { Tipo = TipoFila.DEF3054, Numero = 10 },
                        new Fila { Tipo = TipoFila.DEF3074, Numero = 12 }
                    }
                }
            }
        };
    }
}