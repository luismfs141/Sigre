using OfficeOpenXml;
using Sigre.DataAccess;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.BusinessLogic.Vano
{
    public class BLGap
    {
        public ExcelWorkbook BLGAP_AgregarTramosAlReporte(ExcelWorkbook workbook, int alimInterno)
        {
            DAGap dAGap = new DAGap();

            var tramosPorVano = dAGap.DAGAP_ObtenerTramosPorAlimentador(alimInterno);

            const int filaVanos = 10;
            const int filaTramos = 8;
            const int columnaInicioVanos = 13; // M
            const int columnaEtiquetaTramos = 12; // K

            // Buscar únicamente la hoja VMT
            var ws = workbook.Worksheets["VMT"];

            if (ws == null || ws.Dimension == null)
                return workbook;

            int ultimaColumna = ws.Dimension.End.Column;

            // Guardar los códigos de vano antes de insertar la fila.
            var vanosPorColumna = new Dictionary<int, string>();

            int ultimaColumnaVanos = columnaInicioVanos - 1;

            for (int columna = columnaInicioVanos; columna <= ultimaColumna; columna++)
            {
                string vanoCodigo = ws.Cells[filaVanos, columna]
                    .Text?
                    .Trim();

                if (!string.IsNullOrWhiteSpace(vanoCodigo))
                {
                    vanosPorColumna[columna] = vanoCodigo;
                    ultimaColumnaVanos = columna;
                }
            }

            // Insertar nueva fila en la posición 8.
            ws.InsertRow(filaTramos, 1);

            // Colocar "Tramos MT" antes de las columnas de vanos.
            var celdaEtiqueta = ws.Cells[filaTramos, columnaEtiquetaTramos];

            celdaEtiqueta.Value = "Tramos MT";

            var tramosAgregados = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Colocar el código de tramo correspondiente a cada vano.
            foreach (var item in vanosPorColumna)
            {
                int columna = item.Key;
                string vanoCodigo = item.Value;

                if (tramosPorVano.TryGetValue(vanoCodigo, out string tramoCodigo) &&
                    !string.IsNullOrWhiteSpace(tramoCodigo))
                {
                    var celda = ws.Cells[filaTramos, columna];

                    celda.Value = tramoCodigo;

                    celda.Style.Border.Top.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.Border.Left.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.Border.Right.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
                    celda.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                    celda.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Center;

                    // Contabilizar solamente los tramos agregados al Excel.
                    tramosAgregados.Add(tramoCodigo);
                }
            }

            // Cantidad de tramos únicos agregados al Excel.
            var celdaCantidad = ws.Cells[filaTramos, 11];

            celdaCantidad.Value = tramosAgregados.Count;
            celdaCantidad.Style.Border.Top.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.Border.Left.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.Border.Right.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaCantidad.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
            celdaCantidad.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Center;

            // Bordes de "Tramos MT".
            celdaEtiqueta.Style.Border.Top.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.Border.Left.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.Border.Right.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
            celdaEtiqueta.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
            celdaEtiqueta.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Center;

            return workbook;
        }
    }
}
