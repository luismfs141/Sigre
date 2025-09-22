using System;
using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace Sigre.App
{
    public partial class App : Application
    {
        public App()
        {
            Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("MTUwMTIxQDMxMzcyZTMzMmUzMEpNSncza0pidFlBVTlQMUJiQnZkZnJydThEcTk5Ly95RUtWMjdBNmZRVWM9");

            InitializeComponent();

            MainPage = new MainPage();
        }

        protected override void OnStart()
        {
            // Handle when your app starts
        }

        protected override void OnSleep()
        {
            // Handle when your app sleeps
        }

        protected override void OnResume()
        {
            // Handle when your app resumes
        }
    }
}
