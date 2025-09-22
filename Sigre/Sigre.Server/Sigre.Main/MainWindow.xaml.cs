using Sigre.BusinessLogic.Deficiencia;
using Sigre.FoundationModule;
using System.Configuration;
using System.Windows;

namespace Sigre.Main
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        //GP01-139,28,164,37,38,138
        //GP02-4,32,39,40,41,179
        //GP03-1-7-14-19-23-24
        public MainWindow()
        {
            InitializeComponent();

            AppSettings.AppSettings.PhotosPath = ConfigurationManager.AppSettings["RutaFotos"];

            var task = ProxyBase.RunAsync();
            task.Wait();
        }
        //REPORTES SEAL
        private void button_Click(object sender, RoutedEventArgs e)
        {
            DeficiencyBL deficiencyBL = new DeficiencyBL();
            deficiencyBL.ExportDeficiencies(33);
        }
        //REPORTES REVISION
        private void button_Reports(object sender, RoutedEventArgs e)
        {
            DeficiencyBL deficiencyBL = new DeficiencyBL();
            deficiencyBL.ObtenerReportesRevision(29);
        }
        private void fixPhotosPath_Click(object sender, RoutedEventArgs e)
        {
            PhotosBL photosBL = new PhotosBL();
            photosBL.FixPhotosPath(AppSettings.AppSettings.PhotosPath);
        }
    }
}
