using System;
using System.Collections.Generic;
using System.Text;

namespace Sigre.App.Utilitarios
{
    public class Utilitarios
    {
        public static string ObtenerUltimaExcepcion(Exception ex)
        {
            if (ex.InnerException != null)
            { return ObtenerUltimaExcepcion(ex.InnerException); }
            else
            { return ex.Message; }
        }
    }
}
