using Sigre.BusinessLogic.Utilidades;
using OfficeOpenXml;
using Sigre.DataAccess;

namespace Sigre.BusinessLogic.Principal
{
    public class BLDefciency
    {
        public List<DeficiencyResult> LeerReporte(ExcelWorkbook workbook)
        {
            var lista = new List<DeficiencyResult>();

            foreach (var configuracion in ConfigReport.Hojas)
            {
                var ws = workbook.Worksheets[configuracion.Nombre];

                if (ws == null)
                    continue;

                var datosGenerales = LeerDatosGenerales(
                    ws,
                    configuracion);

                LeerElementos(
                    ws,
                    configuracion,
                    datosGenerales,
                    lista);
            }

            return lista;
        }

        private Dictionary<ConfigReport.TipoFila, string> LeerDatosGenerales(ExcelWorksheet ws, ConfigReport.Hoja configuracion)
        {
            var datos = new Dictionary<ConfigReport.TipoFila, string>();

            foreach (var fila in configuracion.DatosGenerales)
            {
                string valor = ws.Cells[fila.Numero, 14].Text?.Trim() ?? string.Empty;

                datos[fila.Tipo] = valor;
            }

            return datos;
        }

        private void LeerElementos(ExcelWorksheet ws, ConfigReport.Hoja configuracion, Dictionary<ConfigReport.TipoFila, string> datosGenerales, List<DeficiencyResult> lista)
        {
            var filaIdentificador = configuracion.Elemento.Datos
                .FirstOrDefault(x =>
                    x.Tipo == ConfigReport.TipoFila.Codigo ||
                    x.Tipo == ConfigReport.TipoFila.CodigoGis);

            if (filaIdentificador == null)
                return;

            int columnaInicio = 13;
            int columnaFin = ws.Dimension.End.Column;

            for (int columna = columnaInicio; columna <= columnaFin; columna++)
            {
                string codigo = ws.Cells[
                    filaIdentificador.Numero,
                    columna
                ].Text?.Trim() ?? string.Empty;

                if (string.IsNullOrWhiteSpace(codigo))
                    continue;

                var resultado = new DeficiencyResult
                {
                    NombreHoja = configuracion.Nombre,
                    DatosGenerales = new Dictionary<ConfigReport.TipoFila, string>(
                        datosGenerales)
                };

                LeerDatosElemento(
                    ws,
                    configuracion.Elemento,
                    columna,
                    resultado);

                LeerDeficiencias(
                    ws,
                    configuracion.Elemento,
                    columna,
                    resultado);

                lista.Add(resultado);
            }
        }

        private void LeerDatosElemento(ExcelWorksheet ws, ConfigReport.Elemento configuracion, int columna,DeficiencyResult resultado)
        {
            foreach (var fila in configuracion.Datos)
            {
                string valor = ws.Cells[
                    fila.Numero,
                    columna
                ].Text?.Trim() ?? string.Empty;

                resultado.DatosElemento[fila.Tipo] = valor;
            }
        }

        private void LeerDeficiencias(ExcelWorksheet ws, ConfigReport.Elemento configuracion, int columna, DeficiencyResult resultado)
        {
            foreach (var deficiencia in configuracion.Deficiencias)
            {
                string valor = ws.Cells[
                    deficiencia.Numero,
                    columna
                ].Text?.Trim() ?? string.Empty;

                if (valor.Equals("SI", StringComparison.OrdinalIgnoreCase) ||
                    valor.Equals("SÍ", StringComparison.OrdinalIgnoreCase))
                {
                    resultado.Deficiencias.Add(deficiencia.Tipo);
                }
            }
        }
    }
}
