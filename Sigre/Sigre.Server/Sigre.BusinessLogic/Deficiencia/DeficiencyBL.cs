using Sigre.Entities;
using Sigre.FoundationModule;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Office;
using System.ComponentModel.Design.Serialization;
using Sigre.Entities.Entities.Structs;
using System.Collections;
using System.Reflection.Metadata.Ecma335;
using System.Runtime.Intrinsics.Arm;

namespace Sigre.BusinessLogic.Deficiencia
{
    public class DeficiencyBL
    {
        public const string Yes = "Sí";
        public const string No = "No";
        public const string root = "D:\\Fotos-Reportes\\";

        private int IndexOfOccurence(string s, string match, int occurence)
        {
            int i = 1;
            int index = 0;
            if (s.Length > 0) {
                while (i <= occurence && (index = s.IndexOf(match, index + 1)) != -1)
                {
                    if (i == occurence)
                        return index;

                    i++;
                }
            }

            return 0;
        }

        private int alturaRandom()
        {
            Random random = new Random();
            int[] alturapostes = new int[] { 12, 13 };
            return alturapostes[random.Next(2)];
        }

        public async void ExportDeficiencies(int x_feeder_Id)
        {
            Microsoft.Office.Interop.Excel.Application XL = new Microsoft.Office.Interop.Excel.Application();
            Microsoft.Office.Interop.Excel.Workbook WB = XL.Workbooks.Add(System.AppDomain.CurrentDomain.BaseDirectory + "Reportes\\ReportesSigre.xltx");
            Microsoft.Office.Interop.Excel.Worksheet WS = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[1];
            Microsoft.Office.Interop.Excel.Range formatoPoste = WS.Range[WS.Cells[8, 1], WS.Cells[38, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotal = WS.Range[WS.Cells[8, 2], WS.Cells[23, 9]];

            bool control = false;
            int s0 = 0; int s1 = 0; int s2 = 0; int n0 = 0;int n1 = 0;  int st = 0;
            string ruta = "";

            var posts = await PostProxy.GetByFeederAsync(x_feeder_Id);

            int[,] countDetalle = new int[10, 5];
            object[,] elementos = new object[31, posts.Count];

            List<string> typificationsPost = new List<string>()
            {
                "1002", "1008", "1012", "1034", "1036", "1042", "1072", "1074", "1082", "1086"
            };
            int elementAnt = 0;

            WS.Cells[4, 14] = "Consorcio Arce SRL - AEE SRL";
            WS.Cells[5, 14] = posts[0].FeederLabel;
            WS.Cells[6, 14] = DateTime.Now;

            int a = 3; int b = 0; int totalcolumnas = 0; int count = 0;

            foreach (var typification in typificationsPost)
            {

                if (typification == "1034" || typification == "1082")
                {
                    a++;
                }
                if (typification == "1072")
                {
                    a = a + 5;
                }
                foreach (var post in posts)
                {

                    if (a == 3)
                    {
                        formatoPoste.Copy(WS.Range[WS.Cells[8, b + 13], WS.Cells[38, b + 13]]);
                        elementos[0, b] = post.Label;
                        elementos[1, b] = post.CodINS;
                        elementos[2, b] = post.ElementMaterial != "" ? "1" + post.ElementMaterial.Substring(0, 1) + alturaRandom() : "SN";
                        elementos[11, b] = post.ArmedType;
                        elementos[12, b] = post.ArmedMaterial;
                        if (post.Subsanacion == "S0" || post.Subsanacion == "S1" || post.Subsanacion == "S2" || post.Subsanacion == "N0" || post.Subsanacion =="N1")
                        {
                            int indexofFourSlash = IndexOfOccurence(post.PhotosPath, "/", 4);
                            ruta = post.PhotosPath.Substring(0, indexofFourSlash);
                        }
                        else
                        {
                            ruta = post.PhotosPath;
                        }
                        elementos[20, b] = post.ElementCritical;
                        elementos[21, b] = "=HIPERVINCULO(\"" + root + ruta + "\",\"Ver Fotos\")";
                        elementos[25, b] = 0;
                        elementos[26, b] = 0;
                        elementos[27, b] = 0;
                        elementos[28, b] = 0;
                        elementos[29, b] = 0;
                    }
                    if (post.ElementId == elementAnt)
                    {
                        b--;

                        if (post.Subsanacion == "S0") { elementos[25, b] = ++s0; }
                        if (post.Subsanacion == "S1") { elementos[26, b] = ++s1; }
                        if (post.Subsanacion == "S2") { elementos[27, b] = ++s2; }
                        if (post.Subsanacion == "N0") { elementos[28, b] = ++n0; }
                        if (post.Subsanacion == "N1") { elementos[29, b] = ++n1; }
                        st = s0 + s1 + s2 + n0 +n1;
                        elementos[30, b] = st;
                    }
                    else
                    {
                        s0 = 0; s1 = 0; s2 = 0; n0 = 0; n1 = 0; st = 0;
                        if (a == 3) { totalcolumnas++; }

                        if (post.Subsanacion == "S0") { elementos[25, b] = ++s0; }
                        if (post.Subsanacion == "S1") { elementos[26, b] = ++s1; }
                        if (post.Subsanacion == "S2") { elementos[27, b] = ++s2; }
                        if (post.Subsanacion == "N0") { elementos[28, b] = ++n0; }
                        if (post.Subsanacion == "N1") { elementos[29, b] = ++n1; }
                        st = s0 + s1 + s2 + n0 + n1;
                        elementos[30, b] = st;

                        control = false;
                    }

                    if (post.TypificationCode == typification)
                    {
                        elementos[a, b++] = Yes;
                        control = true;

                        if (post.Subsanacion == "S0")
                        {
                            countDetalle[count, 0]++;
                        }
                        if (post.Subsanacion == "S1")
                        {
                            countDetalle[count, 1]++;
                        }
                        if (post.Subsanacion == "S2")
                        {
                            countDetalle[count, 2]++;
                        }
                        if (post.Subsanacion == "N0")
                        {
                            countDetalle[count, 3]++;
                        }
                        if (post.Subsanacion == "N1")
                        {
                            countDetalle[count, 4]++;
                        }

                    }
                    else
                    {
                        elementos[a, b++] = control == true ? Yes : No;
                    }
                    elementAnt = post.ElementId;
                }
                a++; b = 0;
                count++;
            }
            Console.WriteLine("50%");
            elementAnt = 0;


            Microsoft.Office.Interop.Excel.Range holder1 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[8, 13];
            Microsoft.Office.Interop.Excel.Range holder2 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[38, posts.Count + 12];
            Microsoft.Office.Interop.Excel.Range holder3 = WS.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotal.Copy(WS.Range[WS.Cells[8, totalcolumnas + 14], WS.Cells[23, totalcolumnas + 22]]);

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[13, totalcolumnas + 15];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[22, totalcolumnas + 19];
            holder3 = WS.get_Range(holder1, holder2);
            holder3.Value = countDetalle;

            int q = 0;
            while (q < 10)
            {
                WS.Cells[13 + q, totalcolumnas + 20] = countDetalle[q, 0] + countDetalle[q, 1] + countDetalle[q, 2] + countDetalle[q, 3]+ countDetalle[q,4];
                q++;
            }
            int r = 0;
            while (r < 5)
            {
                WS.Cells[23, totalcolumnas + 15 + r] = countDetalle[0, r] + countDetalle[1, r] + countDetalle[2, r] + countDetalle[3, r] + countDetalle[4, r] + countDetalle[5, r] + countDetalle[6, r] + countDetalle[7, r] + countDetalle[8, r] + countDetalle[9, r];
                r++;
            }

            totalcolumnas = 0;
            count = 0;

            //<<<<<<<<<<<<<<<<<<<<<<<<<<<<VANOS>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


            Microsoft.Office.Interop.Excel.Worksheet WS2 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[2];
            Microsoft.Office.Interop.Excel.Range formatoVano = WS2.Range[WS2.Cells[8, 1], WS2.Cells[28, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotalVano = WS2.Range[WS2.Cells[6, 2], WS2.Cells[19, 9]];

            var gaps = await GapProxy.GetByFeederAsync(x_feeder_Id);

            elementos = new object[21, gaps.Count];
            int[,] countDetalleVanos = new int[7, 5];

            List<string> typificationsGaps = new List<string>()
            {
                "5010", "5016", "5018", "5026", "5030", "5032", "5038"
            };

            WS2.Cells[4, 14] = "Consorcio Arce SRL - AEE SRL";
            WS2.Cells[5, 14] = gaps[0].FeederLabel;
            WS2.Cells[6, 14] = DateTime.Now.ToString("dd-MM-yyyy");

            a = 3; b = 0;

            foreach (var typification in typificationsGaps)
            {
                foreach (var gap in gaps)
                {
                    if (a == 3)
                    {
                        formatoVano.Copy(WS2.Range[WS2.Cells[8, b + 13], WS2.Cells[28, b + 13]]);
                        elementos[0, b] = gap.StartNode;
                        elementos[1, b] = gap.EndNode;
                        elementos[2, b] = gap.CodINS;
                        if (gap.Subsanacion == "S0" || gap.Subsanacion == "S1" || gap.Subsanacion == "S2" || gap.Subsanacion == "N0" || gap.Subsanacion == "N1")
                        {
                            int indexofFourSlash = IndexOfOccurence(gap.PhotosPath, "/", 4);
                            ruta = gap.PhotosPath.Substring(0, indexofFourSlash);
                        }
                        else
                        {
                            ruta = gap.PhotosPath;
                        }

                        elementos[10, b] = gap.ElementCritical;
                        elementos[11, b] = "=HIPERVINCULO(\"" + root + ruta + "\",\"Ver Fotos\")";
                        elementos[15, b] = 0;
                        elementos[16, b] = 0;
                        elementos[17, b] = 0;
                        elementos[18, b] = 0;
                        elementos[19, b] = 0;

                    }
                    if (gap.ElementId == elementAnt)
                    {
                        b--;
                        if (gap.Subsanacion == "S0") { elementos[15, b] = ++s0; }
                        if (gap.Subsanacion == "S1") { elementos[16, b] = ++s1; }
                        if (gap.Subsanacion == "S2") { elementos[17, b] = ++s2; }
                        if (gap.Subsanacion == "N0") { elementos[18, b] = ++n0; }
                        if (gap.Subsanacion == "N1") { elementos[19, b] = ++n1; }
                        st = s0 + s1 + s2 + n0 +n1;
                        elementos[20, b] = st;

                    }
                    else
                    {
                        s0 = 0; s1 = 0; s2 = 0; n0 = 0; n1 = 0; st = 0;
                        if (a == 3) { totalcolumnas++; }

                        if (gap.Subsanacion == "S0") { elementos[15, b] = ++s0; }
                        if (gap.Subsanacion == "S1") { elementos[16, b] = ++s1; }
                        if (gap.Subsanacion == "S2") { elementos[17, b] = ++s2; }
                        if (gap.Subsanacion == "N0") { elementos[18, b] = ++n0; }
                        if (gap.Subsanacion == "N1") { elementos[19, b] = ++n1; }
                        st = s0 + s1 + s2 + n0 + n1;
                        elementos[20, b] = st;

                        control = false;
                    }


                    if (gap.TypificationCode == typification)
                    {
                        elementos[a, b++] = Yes;
                        control = true;

                        if (gap.Subsanacion == "S0")
                        {
                            countDetalleVanos[count, 0]++;
                        }
                        if (gap.Subsanacion == "S1")
                        {
                            countDetalleVanos[count, 1]++;
                        }
                        if (gap.Subsanacion == "S2")
                        {
                            countDetalleVanos[count, 2]++;
                        }
                        if (gap.Subsanacion == "N0")
                        {
                            countDetalleVanos[count, 3]++;
                        }
                        if (gap.Subsanacion == "N1")
                        {
                            countDetalleVanos[count, 4]++;
                        }
                    }
                    else
                    {
                        elementos[a, b++] = control == true ? Yes : No;
                    }
                    elementAnt = gap.ElementId;
                }
                a++; b = 0;
                count++;
            }
            Console.WriteLine("90%");
            elementAnt = 0;

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[8, 13];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[28, gaps.Count + 12];
            holder3 = WS2.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotalVano.Copy(WS2.Range[WS2.Cells[6, totalcolumnas + 14], WS2.Cells[19, totalcolumnas + 21]]);

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[12, totalcolumnas + 15];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[18, totalcolumnas + 19];
            holder3 = WS2.get_Range(holder1, holder2);
            holder3.Value = countDetalleVanos;

            q = 0;
            while (q < 7)
            {
                WS2.Cells[12 + q, totalcolumnas + 20] = countDetalleVanos[q, 0] + countDetalleVanos[q, 1] + countDetalleVanos[q, 2] + countDetalleVanos[q, 3] +countDetalleVanos[q,4];
                q++;
            }
            r = 0;
            while (r < 5)
            {
                WS2.Cells[19, totalcolumnas + 15 + r] = countDetalleVanos[0, r] + countDetalleVanos[1, r] + countDetalleVanos[2, r] + countDetalleVanos[3, r] + countDetalleVanos[4, r] + countDetalleVanos[5, r] + countDetalleVanos[6, r];
                r++;
            }

            totalcolumnas = 0;
            count = 0;

            //<<<<<<<<<<<<<<<<<<<<<<<<<<<<SEDsMB>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

            Microsoft.Office.Interop.Excel.Worksheet WS3 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[3];
            Microsoft.Office.Interop.Excel.Range formatoSed_A = WS3.Range[WS3.Cells[8, 1], WS3.Cells[42, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotalSedMB = WS3.Range[WS3.Cells[8, 2], WS3.Cells[28, 9]];

            var seds = await SedProxy.GetByFeederAsync(x_feeder_Id);

            List<ElementStruct> seds_A = seds.Where(s => s.SedType == "M" || s.SedType == "B").ToList();

            elementos = new object[35, seds_A.Count];

            int[,] countDetalleSedMB = new int[14, 5];
            List<string> typificationsSedsMB = new List<string>()
            {
                "2002", "2004", "2008", "2024", "2026", "2034", "2132", "2040", "2072", "2074", "2082", "2086", "2106", "2104"
            };

            WS3.Cells[4, 14] = "Consorcio Arce SRL - AEE SRL";
            WS3.Cells[5, 14] = seds_A[0].FeederLabel;
            WS3.Cells[6, 14] = DateTime.Now.ToString("dd-MM-yyyy");

            a = 4; b = 0;
            foreach (var typification in typificationsSedsMB)
            {
                if (typification == "2008" || typification == "2024" || typification == "2040" || typification == "2072" || typification == "2082" || typification == "2106")
                {
                    a++;
                }
                control = false;
                foreach (var sed in seds_A)
                {
                    if (a == 4)
                    {
                        formatoSed_A.Copy(WS3.Range[WS3.Cells[8, b + 13], WS3.Cells[42, b + 13]]);
                        elementos[0, b] = sed.Label;
                        elementos[2, b] = sed.SedType;
                        elementos[3, b] = sed.PostNum > 0 ? sed.PostNum + sed.ElementMaterial.Substring(0, 1) + alturaRandom() : 1 + sed.ElementMaterial + alturaRandom();
                        if (sed.Subsanacion == "S0" || sed.Subsanacion == "S1" || sed.Subsanacion == "S2" || sed.Subsanacion == "N0" || sed.Subsanacion == "N1")
                        {
                            int indexofFourSlash = IndexOfOccurence(sed.PhotosPath, "/", 4);
                            ruta = sed.PhotosPath.Substring(0, indexofFourSlash);
                        }
                        else
                        {
                            ruta = sed.PhotosPath;
                        }
                        elementos[24, b] = sed.ElementCritical;
                        elementos[25, b] = "=HIPERVINCULO(\"" + root + ruta + "\",\"Ver Fotos\")";
                        elementos[29, b] = 0;
                        elementos[30, b] = 0;
                        elementos[31, b] = 0;
                        elementos[32, b] = 0;
                        elementos[33, b] = 0;

                    }

                    if (sed.ElementId == elementAnt)
                    {
                        b--;
                        if (sed.Subsanacion == "S0") { elementos[29, b] = ++s0; }
                        if (sed.Subsanacion == "S1") { elementos[30, b] = ++s1; }
                        if (sed.Subsanacion == "S2") { elementos[31, b] = ++s2; }
                        if (sed.Subsanacion == "N0") { elementos[32, b] = ++n0; }
                        if (sed.Subsanacion == "N1") { elementos[33, b] = ++n0; }

                        st = s0 + s1 + s2 + n0 +n1;
                        elementos[34, b] = st;
                    }
                    else
                    {
                        if (a == 4) { totalcolumnas++; }
                        s0 = 0; s1 = 0; s2 = 0; n0 = 0; n1 = 0; st = 0;

                        if (sed.Subsanacion == "S0") { elementos[29, b] = ++s0; }
                        if (sed.Subsanacion == "S1") { elementos[30, b] = ++s1; }
                        if (sed.Subsanacion == "S2") { elementos[31, b] = ++s2; }
                        if (sed.Subsanacion == "N0") { elementos[32, b] = ++n0; }
                        if (sed.Subsanacion == "N1") { elementos[33, b] = ++n1; }

                        st = s0 + s1 + s2 + n0 + n1;
                        elementos[34, b] = st;
                        control = false;
                    }

                    if (sed.TypificationCode == typification)
                    {
                        elementos[a, b++] = Yes;
                        control = true;

                        if (sed.Subsanacion == "S0")
                        {
                            countDetalleSedMB[count, 0]++;
                        }
                        if (sed.Subsanacion == "S1")
                        {
                            countDetalleSedMB[count, 1]++;
                        }
                        if (sed.Subsanacion == "S2")
                        {
                            countDetalleSedMB[count, 2]++;
                        }
                        if (sed.Subsanacion == "N0")
                        {
                            countDetalleSedMB[count, 3]++;
                        }
                        if (sed.Subsanacion == "N1")
                        {
                            countDetalleSedMB[count, 4]++;
                        }
                    }
                    else
                    {
                        elementos[a, b++] = control == true ? Yes : No;
                    }
                    elementAnt = sed.ElementId;
                }
                a++; b = 0;
                count++;
            }
            elementAnt = 0;

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[8, 13];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[42, seds_A.Count + 12];
            holder3 = WS3.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotalSedMB.Copy(WS3.Range[WS3.Cells[8, totalcolumnas + 15], WS3.Cells[28, totalcolumnas + 21]]);
            holder1 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[14, totalcolumnas + 16];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[27, totalcolumnas + 20];
            holder3 = WS3.get_Range(holder1, holder2);
            holder3.Value = countDetalleSedMB;

            q = 0;
            while (q < 14)
            {
                WS3.Cells[14 + q, totalcolumnas + 21] = countDetalleSedMB[q, 0] + countDetalleSedMB[q, 1] + countDetalleSedMB[q, 2] + countDetalleSedMB[q, 3] + countDetalleSedMB[q,4];
                q++;
            }
            r = 0;
            while (r < 5)
            {
                WS3.Cells[28, totalcolumnas + 16 + r] = countDetalleSedMB[0, r] + countDetalleSedMB[1, r] + countDetalleSedMB[2, r] + countDetalleSedMB[3, r] + countDetalleSedMB[4, r] + countDetalleSedMB[5, r] + countDetalleSedMB[6, r] +
                                                        countDetalleSedMB[7, r] + countDetalleSedMB[8, r] + countDetalleSedMB[9, r] + countDetalleSedMB[10, r] + countDetalleSedMB[11, r] + countDetalleSedMB[12, r] + countDetalleSedMB[13, r];
                r++;
            }

            totalcolumnas = 0;
            count = 0;

            //<<<<<<<<<<<<<<<<<<<<<<<<<<<<SEDsC>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

            Microsoft.Office.Interop.Excel.Worksheet WS4 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[4];
            Microsoft.Office.Interop.Excel.Range formatoSed_C = WS4.Range[WS4.Cells[7, 1], WS4.Cells[22, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotalSedC = WS4.Range[WS4.Cells[3, 2], WS4.Cells[11, 9]];

            List<ElementStruct> seds_C = seds.Where(s => s.SedType == "C").ToList();

            elementos = new object[16, seds_C.Count];

            int[,] countDetalleSedC = new int[3, 5];
            List<string> typificationsSedsC = new List<string>()
        {
            "3052", "3054", "3074"
        };

            WS4.Cells[3, 14] = "Consorcio Arce SRL - AEE SRL";
            WS4.Cells[4, 14] = seds_A[0].FeederLabel;
            WS4.Cells[5, 14] = DateTime.Now.ToString("dd-MM-yyyy");

            a = 2; b = 0;
            foreach (var typification in typificationsSedsC)
            {
                if (typification == "3074")
                {
                    a++;
                }
                if (seds_C.Count > 0)
                {
                    foreach (var sed in seds_C)
                    {
                        if (a == 2)
                        {
                            formatoSed_C.Copy(WS4.Range[WS4.Cells[7, b + 13], WS4.Cells[22, b + 13]]);
                            elementos[0, b] = sed.Label;
                            if (sed.Subsanacion == "S0" || sed.Subsanacion == "S1" || sed.Subsanacion == "S2" || sed.Subsanacion == "N0")
                            {
                                int indexofFourSlash = IndexOfOccurence(sed.PhotosPath, "/", 4);
                                ruta = sed.PhotosPath.Substring(0, indexofFourSlash);
                            }
                            else
                            {
                                ruta = sed.PhotosPath;
                            }
                            elementos[6, b] = sed.ElementCritical;
                            elementos[7, b] = "=HIPERVINCULO(\"" + root + ruta + "\",\"Ver Fotos\")";
                            elementos[10, b] = 0;
                            elementos[11, b] = 0;
                            elementos[12, b] = 0;
                            elementos[13, b] = 0;
                            elementos[14, b] = 0;
                        }
                        if (sed.ElementId == elementAnt && seds_C.Count>1)
                        {
                            b--;
                            if (sed.Subsanacion == "S0") { elementos[10, b] = ++s0; }
                            if (sed.Subsanacion == "S1") { elementos[11, b] = ++s1; }
                            if (sed.Subsanacion == "S2") { elementos[12, b] = ++s2; }
                            if (sed.Subsanacion == "N0") { elementos[13, b] = ++n0; }
                            if (sed.Subsanacion == "N1") { elementos[14, b] = ++n1; }
                            st = s0 + s1 + s2 + n0 + n1;
                            elementos[15, b] = st;
                        }
                        else
                        {
                            s0 = 0; s1 = 0; s2 = 0; n0 = 0; st = 0;
                            if (a == 2) { totalcolumnas++; }

                            if (sed.Subsanacion == "S0") { elementos[10, b] = ++s0; }
                            if (sed.Subsanacion == "S1") { elementos[11, b] = ++s1; }
                            if (sed.Subsanacion == "S2") { elementos[12, b] = ++s2; }
                            if (sed.Subsanacion == "N0") { elementos[13, b] = ++n0; }
                            if (sed.Subsanacion == "N1") { elementos[14, b] = ++n1; }

                            st = s0 + s1 + s2 + n0 +n1;
                            elementos[15, b] = st;
                            control = false;
                        }


                        if (sed.TypificationCode == typification)
                        {
                            elementos[a, b++] = Yes;
                            control = true;

                            if (sed.Subsanacion == "S0")
                            {
                                countDetalleSedC[count, 0]++;
                            }
                            if (sed.Subsanacion == "S1")
                            {
                                countDetalleSedC[count, 1]++;
                            }
                            if (sed.Subsanacion == "S2")
                            {
                                countDetalleSedC[count, 2]++;
                            }
                            if (sed.Subsanacion == "N0")
                            {
                                countDetalleSedC[count, 3]++;
                            }
                            if (sed.Subsanacion == "N1")
                            {
                                countDetalleSedC[count, 4]++;
                            }
                        }
                        else
                        {
                            elementos[a, b++] = control == true ? Yes : No;
                        }
                        elementAnt = sed.ElementId;
                    }
                    a++; b = 0;
                    count++;
                }
                
            }

            elementAnt = 0;

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS4.Cells[7, 13];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS4.Cells[22, seds_C.Count + 12];
            holder3 = WS4.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotalSedC.Copy(WS4.Range[WS4.Cells[7, totalcolumnas + 14], WS4.Cells[15, totalcolumnas + 20]]);
            holder1 = (Microsoft.Office.Interop.Excel.Range)WS4.Cells[12, totalcolumnas + 15];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS4.Cells[14, totalcolumnas + 19];
            holder3 = WS4.get_Range(holder1, holder2);
            holder3.Value = countDetalleSedC;

            q = 0;
            while (q < 3)
            {
                WS4.Cells[12 + q, totalcolumnas + 20] = countDetalleSedC[q, 0] + countDetalleSedC[q, 1] + countDetalleSedC[q, 2] + countDetalleSedC[q, 3] +countDetalleSedC[q,4];
                q++;
            }
            r = 0;
            while (r < 5)
            {
                WS4.Cells[15, totalcolumnas + 15 + r] = countDetalleSedC[0, r] + countDetalleSedC[1, r] + countDetalleSedC[2, r];
                r++;
            }

            totalcolumnas = 0;

            XL.Visible = true;
        }
        public async void ObtenerReportesRevision(int x_feeder_Id)
        {
            Microsoft.Office.Interop.Excel.Application XL = new Microsoft.Office.Interop.Excel.Application();
            Microsoft.Office.Interop.Excel.Workbook WB = XL.Workbooks.Add(System.AppDomain.CurrentDomain.BaseDirectory + "Reportes\\ReportesRevision.xltx");
            Microsoft.Office.Interop.Excel.Worksheet WS = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[1];
            Microsoft.Office.Interop.Excel.Worksheet WS2 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[2];
            Microsoft.Office.Interop.Excel.Worksheet WS3 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[3];

            var posts = await PostProxy.GetByFeederAsync(x_feeder_Id);

            Object [,] elementos = new object[posts.Count, 35];

            int i = 0; int j = 0;
            foreach ( var post in posts ) {
                elementos[i, j++] = post.FeederCode;
                elementos[i, j++] = post.FeederLabel;
                elementos[i, j++] = post.ElementType;
                elementos[i, j++] = "";
                elementos[i, j++] = "";
                elementos[i, j++] = post.CodINS;
                elementos[i, j++] = post.Label;
                elementos[i, j++] = post.DeficiencyCode;
                elementos[i, j++] = post.Origin;
                elementos[i, j++] = post.TypificationCode;
                elementos[i, j++] = post.Supply;
                elementos[i, j++] = post.Responsible == false? "Consecionaria":"Tercero";
                elementos[i, j++] = post.ElementMaterial;
                elementos[i, j++] = post.HeldType;
                elementos[i, j++] = post.ArmedType;
                elementos[i, j++] = post.ArmedMaterial;
                elementos[i, j++] = post.DistHorizontal;
                elementos[i, j++] = post.DistVertical;
                elementos[i, j++] = post.DenunciationDate;
                elementos[i, j++] = post.InspectionDate;
                elementos[i, j++] = post.RectificationDate;
                elementos[i, j++] = post.RegistrationDate;
                elementos[i, j++] = post.ModificationDate;
                elementos[i, j++] = post.Subsanacion;
                elementos[i, j++] = post.Observation;
                elementos[i, j++] = post.Comment;
                elementos[i, j++] = post.ElementCritical;
                elementos[i, j++] = post.Users;
                elementos[i, j++] = post.PhotosQuantity;
                elementos[i, j++] = post.PhotosPath;
                elementos[i, j++] = "=HIPERVINCULO(\""+ root + post.PhotosPath + "\",\"Ver Fotos\")";
                elementos[i, j++] = post.TypificationCode;
                elementos[i, j++] = post.DistHorizontal;
                elementos[i, j++] = post.DistVertical;
                elementos[i, j++] = post.Supply;
                i++; j = 0;
            }

            Microsoft.Office.Interop.Excel.Range holder1 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[2, 1];
            Microsoft.Office.Interop.Excel.Range holder2 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[posts.Count+1, 35];
            Microsoft.Office.Interop.Excel.Range holder3 = WS.get_Range(holder1, holder2);
            holder3.Value = elementos;

            var seds = await SedProxy.GetByFeederAsync(x_feeder_Id);

            elementos = new object[seds.Count, 37];

            i = 0; j = 0;
            foreach (var sed in seds)
            {
                elementos[i, j++] = sed.FeederCode;
                elementos[i, j++] = sed.FeederLabel;
                elementos[i, j++] = sed.ElementType;
                elementos[i, j++] = "";
                elementos[i, j++] = "";
                elementos[i, j++] = sed.CodINS;
                elementos[i, j++] = sed.Label;
                elementos[i, j++] = sed.DeficiencyCode;
                elementos[i, j++] = sed.Origin;
                elementos[i, j++] = sed.TypificationCode;
                elementos[i, j++] = sed.Supply;
                elementos[i, j++] = sed.Responsible == false? "Concesionaria" : "Tercero";
                elementos[i, j++] = sed.ElementMaterial;
                elementos[i, j++] = sed.HeldType;
                elementos[i, j++] = sed.ArmedType;
                elementos[i, j++] = sed.ArmedMaterial;
                elementos[i, j++] = sed.DistHorizontal;
                elementos[i, j++] = sed.DistVertical;
                elementos[i, j++] = sed.Well1;
                elementos[i, j++] = sed.Well2;
                elementos[i, j++] = sed.DenunciationDate;
                elementos[i, j++] = sed.InspectionDate;
                elementos[i, j++] = sed.RectificationDate;
                elementos[i, j++] = sed.RegistrationDate;
                elementos[i, j++] = sed.ModificationDate;
                elementos[i, j++] = sed.Subsanacion;
                elementos[i, j++] = sed.Observation;
                elementos[i, j++] = sed.Comment;
                elementos[i, j++] = sed.ElementCritical;
                elementos[i, j++] = sed.Users;
                elementos[i, j++] = sed.PhotosQuantity;
                elementos[i, j++] = sed.PhotosPath;
                elementos[i, j++] = "=HIPERVINCULO(\"" + root + sed.PhotosPath + "\",\"Ver Fotos\")";
                elementos[i, j++] = sed.TypificationCode;
                elementos[i, j++] = sed.DistHorizontal;
                elementos[i, j++] = sed.DistVertical;
                elementos[i, j++] = sed.Supply;
                i++; j = 0;
            }

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[2, 1];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[seds.Count + 1, 37];
            holder3 = WS2.get_Range(holder1, holder2);
            holder3.Value = elementos;

            var gaps = await GapProxy.GetByFeederAsync(x_feeder_Id);

            elementos = new object[gaps.Count, 32];

            i = 0; j = 0;
            foreach (var gap in gaps)
            {
                elementos[i, j++] = gap.FeederCode;
                elementos[i, j++] = gap.FeederLabel;
                elementos[i, j++] = gap.ElementType;
                elementos[i, j++] = gap.CodINS;
                elementos[i, j++] = gap.Label;
                elementos[i, j++] = gap.DeficiencyCode;
                elementos[i, j++] = gap.Origin;
                elementos[i, j++] = gap.TypificationCode;
                elementos[i, j++] = gap.Supply;
                elementos[i, j++] = gap.Responsible == false ? "Concesionaria" : "Tercero";
                elementos[i, j++] = gap.ElementMaterial;
                elementos[i, j++] = gap.StartNode;
                elementos[i, j++] = gap.EndNode;
                elementos[i, j++] = gap.DistHorizontal;
                elementos[i, j++] = gap.DistVertical;
                elementos[i, j++] = gap.DenunciationDate;
                elementos[i, j++] = gap.InspectionDate;
                elementos[i, j++] = gap.RectificationDate;
                elementos[i, j++] = gap.RegistrationDate;
                elementos[i, j++] = gap.ModificationDate;
                elementos[i, j++] = gap.Subsanacion;
                elementos[i, j++] = gap.Observation;
                elementos[i, j++] = gap.Comment;
                elementos[i, j++] = gap.ElementCritical;
                elementos[i, j++] = gap.Users;
                elementos[i, j++] = gap.PhotosQuantity;
                elementos[i, j++] = gap.PhotosPath;
                elementos[i, j++] = "=HIPERVINCULO(\"" + root + gap.PhotosPath + "\",\"Ver Fotos\")";
                elementos[i, j++] = gap.TypificationCode;
                elementos[i, j++] = gap.DistHorizontal;
                elementos[i, j++] = gap.DistVertical;
                elementos[i, j++] = gap.Supply;
                i++; j = 0;
            }

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[2, 1];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[gaps.Count + 1, 32];
            holder3 = WS3.get_Range(holder1, holder2);
            holder3.Value = elementos;

            XL.Visible = true;
            Console.WriteLine("100%");
        }
    }
}
