using CoordinateSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Path = System.IO.Path;
using System.Drawing;
using Image = System.Drawing.Image;
using System.Collections;

namespace Sigre.UtilsNF
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public const string BASEPATH = "D:\\Fotos-ReportesGP05\\";

        public MainWindow()
        {
            InitializeComponent();
            this.FixPhotosPath();
        }

        public void FixPhotosPath()
        {
            //this.FixNewAndOldDef();
            //FixPathFeeders();
            //this.FixTypificationsPath();
            //######################
            //GP01-139,28,164,37,38,138
            //GP02-4,32,39,40,41,179
            var CodInterno = 21;

           // ChangeDefToUndef(new int[] { 42432,41870,42196,42151 }); 
           // Codigo de Deficiencia
          //   VerifyRouteArchivos(CodInterno);
         //  CorregirPosos(CodInterno);
          DeleteFilesRoutes(CodInterno);
          this.ReduceFileSeal(CodInterno);
          this.FixPathFolderSeal(CodInterno);

           // CompleteFinalPhotos(CodInterno);
           // RecorrerCarpetas(BASEPATH);
        }
        /// <summary>
        /// Corrige aquellas deficiencias que se trasladaron las fotos desde una deficiencia 
        /// nueva hacia un deficiencia existente
        /// </summary>

        private void ChangeDefToUndef(int[] codDefiInterno)
        {
            sigreEntities ctx = new sigreEntities();

            foreach (int codigo in codDefiInterno)
            {
                var archivos = ctx.sp_ArchivosDefSinDef(codigo).ToList();

                foreach (var archivo in archivos)
                {
                    string oldPath = BASEPATH + archivo.RouteDEF.Replace('/', '\\');
                    string newPath = BASEPATH + archivo.RouteSinDef.Replace('/', '\\');

                    if (Directory.Exists(oldPath))
                    {
                        Directory.Move(oldPath, newPath);
                    }
                }
            }
        }
        //Busca las carpetas que no se encuentran con sus alimentadores
        private void VerifyRouteArchivos(int codAlimentador)
        {
            sigreEntities ctx = new sigreEntities();
            // GP02-4,32,39,40,41,179
            // GP01-139,28,164,37,38,138
            var archivos = ctx.sp_ListaCompletaArchivos(codAlimentador).ToList();
            // VERIFICA CARPETAS
            Console.WriteLine("--------------CARPETAS----------------------");
            foreach (var archivo in archivos)
            {
                if (!Directory.Exists(BASEPATH + archivo.Ruta))
                {
                    Console.WriteLine(archivo.Ruta);
                }
            }
            //VERIFICA FOTOS
            Console.WriteLine("--------------FOTOS----------------------"); 
            foreach (var archivo in archivos)
            {
                if (Directory.Exists(BASEPATH + archivo.Ruta))
                {
                    string[] fotos = Directory.GetFiles(BASEPATH + archivo.Ruta);

                    if (fotos.Length <= 0)
                    {
                        Console.WriteLine(archivo.Ruta.Substring(0, archivo.Ruta.Length));
                    }
                }
            }
        }
        private void DeleteFilesRoutes(int codAlimentador)
        {
            sigreEntities ctx = new sigreEntities();
            //GP02-4,32,39,40,41,179
            //GP01-139,28,164,37,38,138
            var archivos = ctx.sp_ArchivosEliminados(codAlimentador).ToList();

            foreach (var archivo in archivos)
            {
                string ruta = BASEPATH + archivo.Ruta.Replace('/', '\\');
                if (Directory.Exists(ruta))
                {
                    Directory.Delete(ruta, true);
                }
            }
            Console.WriteLine("Finalizado");
        }
        private void FixNewAndOldDef()
        {
            sigreEntities ctx = new sigreEntities();
            var result = ctx.sp_archivos_observados().ToList();

            foreach (var item in result)
            {
                int indexofThirdSlash = IndexOfOccurence(item.Path, "/", 3);
                int lastIndexofSlash = item.Path.LastIndexOf('/');
                var stringToRemove = item.Path.Substring(lastIndexofSlash, item.Path.Length - lastIndexofSlash);
                var newPath = item.Path.Substring(0, indexofThirdSlash) + "/" + item.DEFI_CodDef;

                Directory.Move(BASEPATH + "\\" + item.Path.Replace('/', '\\'), BASEPATH + "\\" + newPath.Replace('/', '\\'));

                var archivos = ctx.Archivos.Where(a => a.ARCH_CodTabla == item.ARCH_CodTabla && a.ARCH_Tabla == "Deficiencias").ToList();
                foreach (var archivo in archivos)
                {
                    archivo.ARCH_Nombre = archivo.ARCH_Nombre.Replace(stringToRemove + "/", "/" + item.DEFI_CodDef + "/");
                }
                ctx.SaveChanges();
            }
        }

        /// <summary>
        /// Corrige aquellas tipificaciones que no coinciden la tipificación
        /// actual de la deficiencia
        /// </summary>
        private void FixTypificationsPath()
        {
            sigreEntities ctx = new sigreEntities();
            var result = ctx.sp_archivos_tipificacionDiferente().ToList();

            foreach (var item in result)
            {
                var newPath = item.OldPath.Substring(0, item.OldPath.Length - 4) + item.RealTypification;
                var stringToRemove = item.OldPath.Substring(item.OldPath.Length - 4, 4); // Suponiendo que todos los codigos de tipificaciones miden 4 caracteres
                if (Directory.Exists(BASEPATH + "\\" + newPath.Replace('/', '\\')))
                {
                    Directory.Move(BASEPATH + "\\" + item.OldPath.Replace('/', '\\'), BASEPATH + "\\" + newPath.Replace('/', '\\') + "-old");
                }
                else
                {
                    Directory.Move(BASEPATH + "\\" + item.OldPath.Replace('/', '\\'), BASEPATH + "\\" + newPath.Replace('/', '\\'));
                }

                var archivos = ctx.Archivos.Where(a => a.ARCH_CodTabla == item.arch_codTabla && a.ARCH_Tabla == "Deficiencias");

                foreach (var archivo in archivos)
                {
                    archivo.ARCH_Nombre = archivo.ARCH_Nombre.Replace("/" + stringToRemove + "/", "/" + item.RealTypification + "/");
                }
                ctx.SaveChanges();
            }
        }

        private int IndexOfOccurence(string s, string match, int occurence)
        {
            int i = 1;
            int index = 0;

            while (i <= occurence && (index = s.IndexOf(match, index + 1)) != -1)
            {
                if (i == occurence)
                    return index;

                i++;
            }

            return -1;
        }

        public void FixPathFeeders()
        {
            /*sigreEntities ctx = new sigreEntities();

            List<sp_ArchivosCompletarAlimentador_Result> faltantes = new List<sp_ArchivosCompletarAlimentador_Result> ();
            List<sp_ArchivosSinDefCompletarAlimentador_Result> faltantesSinDef = new List<sp_ArchivosSinDefCompletarAlimentador_Result>();
            //var defWithoutFeeders = ctx.sp_ArchivosCompletarAlimentador().ToList();
            var sinDefWithoutFeeders = ctx.sp_ArchivosSinDefCompletarAlimentador().ToList();

            foreach(var def in defWithoutFeeders)
            {
                var newPath = BASEPATH + "\\" + def.ALIM_Etiqueta + "\\"+def.Ruta.Replace('/', '\\');
                var oldPath = BASEPATH + "\\" + def.Ruta;

                if (Directory.Exists(oldPath))
                {
                    if (Directory.Exists(newPath))
                    {
                        Directory.Move(newPath, newPath + "old");
                    }
                    Directory.Move(oldPath, newPath);
                }
                else
                {
                    faltantes.Add(def);
                }
            }

            foreach (var sdef in sinDefWithoutFeeders)
            {
                var newPath = BASEPATH + "\\" + sdef.ALIM_Etiqueta + "\\" + sdef.Ruta.Replace('/', '\\');
                var oldPath = BASEPATH + "\\" + sdef.Ruta;
                if (Directory.Exists(oldPath))
                {
                    if (Directory.Exists(newPath))
                    {
                        Directory.Move(newPath, newPath + "old");
                    }
                    Directory.Move(oldPath, newPath);
                }
                else
                {
                    faltantesSinDef.Add(sdef);
                }
            }*/
        }
        public void FixPathFolderSeal(int codAlimentador)
        {
            sigreEntities ctx = new sigreEntities();

            var archivos = ctx.sp_ArchivosSinSEA(codAlimentador).ToList();

            var newPath = "";

            foreach (var archivo in archivos)
            {

                var oldPath = BASEPATH + archivo.Ruta;
                if (archivo.Tipo == "POST")
                {
                    newPath = BASEPATH + archivo.Ruta.Replace(@"POST/", "POST/SEA");
                }
                else
                {
                    newPath = BASEPATH + archivo.Ruta.Replace(@"VANO/", "VANO/SEA");
                }

                int indexofThirdSlash = IndexOfOccurence(oldPath, "/", 3);
                string resp = oldPath.Substring(0, indexofThirdSlash) + "\\RESP";
                Directory.CreateDirectory(resp);

                if (Directory.Exists(oldPath))
                {
                    if (Directory.Exists(newPath))
                    {
                        string cod = "\\" + newPath.Substring(indexofThirdSlash + 1);
                        Directory.Move(newPath, resp + cod);
                    }
                    Directory.Move(oldPath, newPath);
                }
                else
                {
                    continue;
                }

            }
            Console.WriteLine("Operacion finalizada");

        }
        public void FixRenameFilesSeal(int idAlimentador)
        {
            sigreEntities ctx = new sigreEntities();

            var folders = ctx.sp_ArchivosPorAlimentador(idAlimentador).ToList();
            string path = "";
            int i = 0;

            foreach (var folder in folders)
            {
                path = BASEPATH + "\\" + folder.Ruta.Replace('/', '\\') + "\\";

                if (Directory.Exists(path))
                {
                    var files = Directory.GetFiles(path);
                    i = 0;
                    foreach (var file in files)
                    {
                        i++;
                        string extension = Path.GetExtension(file);

                        string nuevoNombre = folder.ultCarpeta + extension;

                        string nuevaRuta = Path.Combine(path, nuevoNombre);

                        if (File.Exists(nuevaRuta))
                        {
                            nuevoNombre = folder.ultCarpeta + "-" + i + extension;

                            nuevaRuta = Path.Combine(path, nuevoNombre);

                            File.Move(file, nuevaRuta);
                        }
                        else
                        {
                            File.Move(file, nuevaRuta);
                        }
                    }
                }
                else
                {
                    continue;
                }

            }
        }

        public void ReduceFileSeal(int codAlimentador)
        {
            sigreEntities ctx = new sigreEntities();

            //GP01-139,28,164,37,38,138
            //GP02-4,32,39,40,41,179

            FixRenameFilesSeal(codAlimentador);//Cambiar CodInterno
            var folders = ctx.sp_ArchivosPorAlimentador(codAlimentador).ToList();//CAMBIAR CODINterno
            string path = "";
            int ancho = 800;
            int alto = 1067;
            //int ancho = 3072;
            //int alto = 4096;

            foreach (var folder in folders)
            {
                path = BASEPATH + folder.Ruta.Replace('/', '\\') + "\\";

                if (Directory.Exists(path))
                {
                    var files = Directory.GetFiles(path);

                    foreach (var file in files)
                    {
                        using (Image image = Image.FromFile(file))
                        {
                            using (Image imagenNueva = new Bitmap(ancho, alto))
                            {
                                using (Graphics graficos = Graphics.FromImage(imagenNueva))
                                {
                                    graficos.DrawImage(image, 0, 0, ancho, alto);
                                }
                                string nuevaRuta = path.Substring(0, path.Length - 2) + Path.GetFileName(file);
                                imagenNueva.Save(nuevaRuta, System.Drawing.Imaging.ImageFormat.Jpeg);
                            }
                        }
                    }
                    Directory.Delete(path, true);
                    Console.WriteLine("Carpeta eliminada");
                }
                else
                {
                    continue;
                }

            }
            Console.WriteLine("Operacion finalizada");
        } 
        public void CorregirPosos(int CodAlimentador) {
            sigreEntities ctx = new sigreEntities();
            var data = ctx.sp_corregir_pozos(CodAlimentador).ToList();
            Console.WriteLine("-------------------Corrector de rutas en carpetas-------------------");
            foreach (var item in data)
            {
                Console.WriteLine("Ruta Original: "+item.ARCH_Nombre);
                Console.WriteLine("Ruta Corregida: "+item.Corregido);
                if (Directory.Exists(BASEPATH + item.ARCH_Nombre))
                {
                    if (!Directory.Exists(BASEPATH + item.Corregido)) {
                        Directory.Move(BASEPATH + item.ARCH_Nombre, BASEPATH + item.Corregido);
                    }
                    else
                    {
                        Directory.Move(BASEPATH + item.ARCH_Nombre, BASEPATH + item.Corregido+"new");
                    }
                }
            }
            //ctx.sp_Update_CorregirPozos(CodAlimentador);

            Console.WriteLine("------------------Finalizado-------------------------------");
        }

   

        public void CompleteFinalPhotos(int codAlimentador)
        {
            sigreEntities ctx = new sigreEntities();

            List<string> faltantes = new List<string>();

            var folders = ctx.sp_GetPathFinal(codAlimentador).ToList();
            Console.WriteLine("--------------------");
            foreach (var folder in folders)
            {
                if (!Directory.Exists(BASEPATH + folder.PhotosPath))
                {
                    //Console.WriteLine(folder.OriginalPath);
               /*     faltantes.Add(BASEPATH + "Original\\Nuevos\\" + folder.OriginalPath);

                    
                    string oldPATH = BASEPATH + "Original\\" + folder.OriginalPath.Replace('/', '\\') + "\\";
                    if (!Directory.Exists(newPATH)) {
                        Directory.CreateDirectory(BASEPATH + "Original\\Nuevos\\"+folder.OriginalPath.Substring(0,folder.OriginalPath.Length -4));
                        Directory.Move(oldPATH, newPATH);
                    }  */          
                }
            }
            Console.WriteLine("--------------------");

        }

        static void RecorrerCarpetas(string directorioActual)
        {               
            // Recorre los archivos en el directorio actual
            string[] archivos = Directory.GetFiles(directorioActual);

            try
            {
                int indice = 0;
                int Archivoslength = archivos.Length - 1;
                foreach (string archivo in archivos)
                {

                    Console.WriteLine(archivo);
                    MoverArchivoANivelSuperior(archivo,indice, Archivoslength);
                    indice++;
                }

                // Recorre las subcarpetas en el directorio actual
                string[] subdirectorios = Directory.GetDirectories(directorioActual);
                foreach (string subdirectorio in subdirectorios)
                {
                    RecorrerCarpetas(subdirectorio); // Llamada recursiva para las subcarpetas
                }
                Console.ReadLine();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Ocurrió un error al mover el archivo: " + ex.Message);
            }     
        }
        static void MoverArchivoANivelSuperior(string archivo,int index,int Archivoslength)
        {
            // Obtener la ruta de destino
            string carpetaOrigen = Path.GetDirectoryName(archivo);
            string nombreArchivo = Path.GetFileName(archivo);
            string carpetaDestino = Directory.GetParent(carpetaOrigen).FullName;
            string NombreCarpetaOrigen = new DirectoryInfo(Path.GetDirectoryName(archivo)).Name;
            string destino = "";

            if (index == 0)
            {
                destino = Path.Combine(carpetaDestino, NombreCarpetaOrigen + ".jpg");
            }
            else {
                destino = Path.Combine(carpetaDestino, NombreCarpetaOrigen + "-" + index + ".jpg");
            }
            

            if (File.Exists(nombreArchivo))
            {
                Console.WriteLine("El archivo existe en la ubicación especificada.");
            }
            else
            {
                Console.WriteLine("El archivo no existe en la ubicación especificada.");
            }
            //  string destino = Path.Combine(carpetaDestino, nombreArchivo);
            // Mover el archivo
            File.Move(archivo, destino);

            //Eliminar Carpeta 
            if (index == Archivoslength) {
                Directory.Delete(carpetaOrigen);
            }
            
        }
    }
}
