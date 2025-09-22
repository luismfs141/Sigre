using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using Xamarin.Forms;

namespace Sigre.App.Utilitarios
{
    public class ParamIgualConv : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {            
            if(value != null && parameter.ToString() == value.ToString())
            { return true; }
            else
            { return false; }
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            return System.Convert.ToBoolean(value) ? "M" : "E" ;
        }
    }
}
