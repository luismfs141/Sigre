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

namespace Sigre.BusinessLogic.Deficiencia
{
    public class DeficiencyBL2
    {
        public const string Yes = "Sí";
        public const string No = "No";
        public const string root = @"D:\Fotos-Reportes\";

        private int IndexOfOccurence(string s, string match, int occurence)
        {
            int i = 1;
            int index = 0;
            if(s.Length > 0) {
                while (i <= occurence && (index = s.IndexOf(match, index + 1)) != -1)
                {
                    if (i == occurence)
                        return index;

                    i++;
                }
            }
            

            return 0;
        }

        public async void ExportDeficiencies(int x_feeder_Id)
        {
            Microsoft.Office.Interop.Excel.Application XL = new Microsoft.Office.Interop.Excel.Application();
            var dir = System.AppDomain.CurrentDomain.BaseDirectory;
            Microsoft.Office.Interop.Excel.Workbook WB = XL.Workbooks.Add(System.AppDomain.CurrentDomain.BaseDirectory + "Reportes\\ReportesSigre.xltx");
            Microsoft.Office.Interop.Excel.Worksheet WS = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[1];
            Microsoft.Office.Interop.Excel.Range formatoPoste = WS.Range[WS.Cells[8, 1], WS.Cells[37, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotal = WS.Range[WS.Cells[8, 2], WS.Cells[23, 7]];

            string ruta = "";

            var posts = await PostProxy.GetByFeederAsync(x_feeder_Id);

            object[,] elementos = new object[29, posts.Count];

            int[,] countDetalle = new int[10,4];

            List<string> typificationsPost = new List<string>()
            {
                "1002", "1008", "1012", "1034", "1036", "1042", "1072", "1074", "1082", "1086"
            };

            WS.Cells[4, 12] = "Arjen S.R.L";
            WS.Cells[5, 12] = posts[0].FeederLabel;
            WS.Cells[6, 12] = DateTime.Now.ToString("dd-MM-yyyy");

            int a = 3; int b = 0; int totalcolumnas = 0; int count=0;

            foreach (var typification in typificationsPost)
            {
                count++;
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
                        formatoPoste.Copy(WS.Range[WS.Cells[8, b + 11], WS.Cells[37, b + 11]]);
                        elementos[0, b] = post.Label;
                        elementos[1, b] = post.CodINS;
                        elementos[2, b] = post.ElementMaterial != "" ? "1" + post.ElementMaterial.Substring(0, 1) + "13" : "SN";
                        elementos[11, b] = post.ArmedType;
                        elementos[12, b] = post.ArmedMaterial;
                        elementos[13, b] = "*";
                        if (post.Subsanacion == "S0" || post.Subsanacion =="S1" || post.Subsanacion == "S2" || post.Subsanacion =="N0")
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
                        elementos[22, b] = ruta;

                        if (a == 3) { totalcolumnas++; }

                        if (post.Subsanacion == "S0") {
                            elementos[25, b] = 1;
                            countDetalle[count, 0]++;
                        }

                        if (post.Subsanacion == "S1") { 
                            elementos[26, b] = 1;
                            countDetalle[count, 1]++;
                        }
                        if (post.Subsanacion == "S2") {
                            elementos[27, b] = 1;
                            countDetalle[count, 2]++;
                        }
                        if (post.Subsanacion == "N0") { 
                            elementos[28, b] = 1;
                            countDetalle[count, 3]++;
                        }
                    }
                    elementos[a, b++] = post.TypificationCode == typification?Yes: No;
                }
                a++; b = 0;
            }

            Microsoft.Office.Interop.Excel.Range holder1 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[8, 11];
            Microsoft.Office.Interop.Excel.Range holder2 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[36, posts.Count + 10];
            Microsoft.Office.Interop.Excel.Range holder3 = WS.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotal.Copy(WS.Range[WS.Cells[8, totalcolumnas + 12], WS.Cells[23, totalcolumnas + 18]]);

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[13, totalcolumnas + 13];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS.Cells[22, totalcolumnas + 16];
            holder3 = WS.get_Range(holder1, holder2);
            holder3.Value = countDetalle;

            totalcolumnas = 0;

            //<<<<<<<<<<<<<<<<<<<<<<<<<<<<VANOS>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


            Microsoft.Office.Interop.Excel.Worksheet WS2 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[2];
            Microsoft.Office.Interop.Excel.Range formatoVano = WS2.Range[WS2.Cells[8, 1], WS2.Cells[27, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotalVano = WS2.Range[WS2.Cells[6, 2], WS2.Cells[19, 7]];

            var gaps = await GapProxy.GetByFeederAsync(x_feeder_Id);

            elementos = new object[19, gaps.Count];

            List<string> typificationsGaps = new List<string>()
            {
                "5010", "5016", "5018", "5026", "5030", "5032", "5038"
            };

            WS2.Cells[4, 12] = "Arjen S.R.L";
            WS2.Cells[5, 12] = gaps[0].FeederLabel;
            WS2.Cells[6, 12] = DateTime.Now.ToString("dd-MM-yyyy");

            a = 3; b = 0;

            foreach (var typification in typificationsGaps)
            {
                foreach (var gap in gaps)
                {
                    if (a == 3)
                    {
                        formatoVano.Copy(WS2.Range[WS2.Cells[8, b + 11], WS2.Cells[27, b + 11]]);
                        elementos[0, b] = gap.StartNode;
                        elementos[1, b] = gap.EndNode;
                        elementos[2, b] = gap.CodINS;
                        if (gap.Subsanacion == "S0" || gap.Subsanacion == "S1" || gap.Subsanacion == "S2" || gap.Subsanacion == "N0")
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
                        elementos[12, b] = ruta;

                        if (a == 3) { totalcolumnas++; }

                        if (gap.Subsanacion == "S0") { elementos[15, b] = 1; }
                        if (gap.Subsanacion == "S1") { elementos[16, b] = 1; }
                        if (gap.Subsanacion == "S2") { elementos[17, b] = 1; }
                        if (gap.Subsanacion == "N0") { elementos[18, b] = 1; }


                    }
                    elementos[a, b++] = gap.TypificationCode == typification ? Yes : No;
                }
                a++; b = 0;
            }

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[8, 11];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS2.Cells[26, gaps.Count + 10];
            holder3 = WS2.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotalVano.Copy(WS2.Range[WS2.Cells[6, totalcolumnas + 12], WS2.Cells[19, totalcolumnas + 18]]);

            totalcolumnas = 0;

            //<<<<<<<<<<<<<<<<<<<<<<<<<<<<SEDsMB>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

            Microsoft.Office.Interop.Excel.Worksheet WS3 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[3];
            Microsoft.Office.Interop.Excel.Range formatoSed_A = WS3.Range[WS3.Cells[8, 1], WS3.Cells[41, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotalSedMB = WS3.Range[WS3.Cells[8, 2], WS3.Cells[28, 7]];

            var seds = await SedProxy.GetByFeederAsync(x_feeder_Id);

            List<ElementStruct> seds_A = seds.Where(s => s.SedType == "M" || s.SedType == "B").ToList();

            elementos = new object[34, seds_A.Count];

            List<string> typificationsSedsMB = new List<string>()
            {
                "2002", "2004", "2008", "2024", "2026", "2034", "2132", "2040", "2072", "2074", "2082", "2086", "2106", "2104"
            };

            WS3.Cells[4, 12] = "Arjen S.R.L";
            WS3.Cells[5, 12] = seds_A[0].FeederLabel;
            WS3.Cells[6, 12] = DateTime.Now.ToString("dd-MM-yyyy");

            a = 4; b = 0;
            foreach (var typification in typificationsSedsMB)
            {
                if (typification == "2008" || typification == "2024" || typification == "2040" || typification == "2072" || typification == "2082" || typification == "2106")
                {
                    a++;
                }
                foreach (var sed in seds_A)
                {
                    if (a == 4)
                    {
                        formatoSed_A.Copy(WS3.Range[WS3.Cells[8, b + 11], WS3.Cells[41, b + 11]]);
                        elementos[0, b] = sed.Label;
                        elementos[1, b] = sed.CodINS;
                        elementos[2, b] = sed.SedType;
                        elementos[3, b] = sed.PostNum > 0 ? sed.PostNum + sed.ElementMaterial + "13" : 0 + sed.ElementMaterial + "13";
                        if (sed.Subsanacion == "S0" || sed.Subsanacion == "S1" || sed.Subsanacion == "S2" || sed.Subsanacion == "N0")
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
                        elementos[26, b] = ruta;

                        if (a == 4) { totalcolumnas++; }

                        if (sed.Subsanacion == "S0") { elementos[29, b] = 1; }
                        if (sed.Subsanacion == "S1") { elementos[30, b] = 1; }
                        if (sed.Subsanacion == "S2") { elementos[31, b] = 1; }
                        if (sed.Subsanacion == "N0") { elementos[32, b] = 1; }

                    }
                    elementos[a, b++] = sed.TypificationCode == typification ? Yes : No;
                }
                a++; b = 0;
            }

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[8, 11];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS3.Cells[41, seds_A.Count + 10];
            holder3 = WS3.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotalSedMB.Copy(WS3.Range[WS3.Cells[8, totalcolumnas + 13], WS3.Cells[28, totalcolumnas + 19]]);

            totalcolumnas = 0;

            //<<<<<<<<<<<<<<<<<<<<<<<<<<<<SEDsC>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

            Microsoft.Office.Interop.Excel.Worksheet WS4 = (Microsoft.Office.Interop.Excel.Worksheet)WB.Worksheets[4];
            Microsoft.Office.Interop.Excel.Range formatoSed_C = WS4.Range[WS4.Cells[7, 1], WS4.Cells[21, 1]];
            Microsoft.Office.Interop.Excel.Range formatoCountTotalSedC = WS4.Range[WS4.Cells[6, 2], WS4.Cells[13, 7]];

            List<ElementStruct> seds_C = seds.Where(s => s.SedType == "C").ToList();

            elementos = new object[15, seds_C.Count];

            List<string> typificationsSedsC = new List<string>()
        {
            "3052", "3054", "3074"
        };

            WS4.Cells[3, 12] = "Arjen S.R.L";
            WS4.Cells[4, 12] = seds_C[0].FeederLabel;
            WS4.Cells[5, 12] = DateTime.Now.ToString("dd-MM-yyyy");

            a = 2; b = 0;
            foreach (var typification in typificationsSedsC)
            {
                if (typification == "3074")
                {
                    a++;
                }
                foreach (var sed in seds_C)
                {
                    if (a == 2)
                    {
                        formatoSed_C.Copy(WS4.Range[WS4.Cells[7, b + 11], WS4.Cells[21, b + 11]]);
                        elementos[0, b] = sed.Label;
                        elementos[1, b] = sed.CodINS;
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
                        elementos[8, b] = ruta;

                        if (a == 2) { totalcolumnas++; }

                        if (sed.Subsanacion == "S0") { elementos[10, b] = 1; }
                        if (sed.Subsanacion == "S1") { elementos[11, b] = 1; }
                        if (sed.Subsanacion == "S2") { elementos[12, b] = 1; }
                        if (sed.Subsanacion == "N0") { elementos[13, b] = 1; }
                    }
                    elementos[a, b++] = sed.TypificationCode == typification? Yes : No;
                }
                a++; b = 0;
            }

            holder1 = (Microsoft.Office.Interop.Excel.Range)WS4.Cells[7, 11];
            holder2 = (Microsoft.Office.Interop.Excel.Range)WS4.Cells[21, seds_C.Count + 10];
            holder3 = WS4.get_Range(holder1, holder2);
            holder3.Value = elementos;

            formatoCountTotalSedC.Copy(WS4.Range[WS4.Cells[6, totalcolumnas + 12], WS4.Cells[13, totalcolumnas + 18]]);

            totalcolumnas = 0;

            XL.Visible = true;
        }
    }  

}
