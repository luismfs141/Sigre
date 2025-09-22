using Sigre.Entities;
using Sigre.Entities.Estructuras;
using Sigre.FoundationalModule;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;
using Xamarin.Forms;

namespace Sigre.App.ViewModels
{
    public class EventoVM : BaseVM
    {
        #region [ Variables ]

        private Evento m_evento;
        private ObservableCollection<Usuario> m_usuarios;
        private ObservableCollection<Item> m_avisos;
        private Item m_aviso;
        private ObservableCollection<Item> m_niveles;
        private Item m_nivel;
        private ObservableCollection<Item> m_instalaciones;
        private Item m_instalacionFallo;
        private Item m_instalacionSalio;
        private Item m_elementoActuo;

        #endregion
        #region [ Propiedades ]

        public Item ElementoActuo
        {
            get => m_elementoActuo;
            set
            {
                SetProperty(ref m_elementoActuo, value);
                this.Evento.EVEN_ElementoActuo = this.ElementoActuo.Id;
            }
        }
        public Item InstalacionSalio
        {
            get => m_instalacionSalio;
            set
            {
                SetProperty(ref m_instalacionSalio, value);
                this.Evento.EVEN_Salio = this.InstalacionSalio.Id;
            }
        }
        public Item InstalacionFallo
        {
            get => m_instalacionFallo;
            set
            {
                SetProperty(ref m_instalacionFallo, value);
                this.Evento.EVEN_Fallo = this.InstalacionFallo.Id;
            }
        }
        public ObservableCollection<Item> Instalaciones
        {
            get => m_instalaciones;
            set
            {
                SetProperty(ref m_instalaciones, value);                
            }
        }
        public Item Nivel
        {
            get => m_nivel;
            set
            {
                SetProperty(ref m_nivel, value);
                this.Evento.EVEN_Nivel = this.Nivel.Id;
            }
        }
        public ObservableCollection<Item> Niveles
        {
            get => m_niveles;
            set
            {
                SetProperty(ref m_niveles, value);                
            }
        }
        public Item Aviso
        {
            get => m_aviso;
            set
            {
                SetProperty(ref m_aviso, value);
                this.Evento.EVEN_Aviso = this.Aviso.Id;
            }
        }
        public ObservableCollection<Item> Avisos
        {
            get => m_avisos;
            set
            {
                SetProperty(ref m_avisos, value);
            }
        }
        public ObservableCollection<Usuario> Usuarios
        {
            get => m_usuarios;
            set
            {
                SetProperty(ref m_usuarios, value);
            }
        }
        public Evento Evento
        {
            get => m_evento;
            set
            {
                SetProperty(ref m_evento, value);
            }
        }

        #endregion
        #region [ Constructores ]

        public EventoVM()
        {
            this.GuardarCommand = new Command(async () => await GuardarAsync());
            this.Evento = new Evento();
            this.Inicializar();
        }

        #endregion
        #region [ Funciones ]

        private void Inicializar()
        {
            try
            {
                Proxy proxy = new Proxy();
                this.Usuarios = new ObservableCollection<Usuario>(proxy.USUA_ObtenerPorTipo("ING"));
                this.Avisos = new ObservableCollection<Item>()
                {
                    new Item(){ Id="P", Valor="Periódico"},
                    new Item(){ Id="R", Valor="Radio"},
                    new Item(){ Id="T", Valor="TV"},
                    new Item(){ Id="S", Valor="Redes Sociales" }
                };
                this.Niveles = new ObservableCollection<Item>()
                {
                    new Item(){ Id = "G", Valor="Generación"},
                    new Item(){ Id= "T", Valor="Transimisión"},
                    new Item(){ Id="D", Valor="Distribución"}
                };
                this.Instalaciones = new ObservableCollection<Item>()
                {
                    new Item() { Id="ALM", Valor="Alimentador"},
                    new Item(){ Id="EQP", Valor="Equipo Protección MT"},
                    new Item(){ Id="TRM", Valor="Tramo MT"},
                    new Item(){ Id="SED", Valor="Subestación de Distribución"}
                };
            }
            catch (Exception ex)
            {
                App.Current.MainPage.DisplayAlert("Sigre", Sigre.App.Utilitarios.Utilitarios.ObtenerUltimaExcepcion(ex), "Aceptar");
            }
        }

        #endregion
        #region  [ Comandos ]

        public ICommand GuardarCommand { get; private set; }
        async Task GuardarAsync()
        {
            try
            {
                await Task.Run(() =>
                    this.Guardar()
                );
                await App.Current.MainPage.DisplayAlert("Sigre", "Guardó correctamente.", "Continuar");
            }
            catch (Exception ex)
            {
                await App.Current.MainPage.DisplayAlert("Sigre", Sigre.App.Utilitarios.Utilitarios.ObtenerUltimaExcepcion(ex), "Aceptar");
            }
        }
        private void Guardar()
        {
            try
            {
                Proxy proxy = new Proxy();
                proxy.EVEN_Guardar(this.Evento);
            }
            catch (Exception ex)
            {
                throw new Exception(Sigre.App.Utilitarios.Utilitarios.ObtenerUltimaExcepcion(ex));
            }            
        }

        #endregion
    }
}
