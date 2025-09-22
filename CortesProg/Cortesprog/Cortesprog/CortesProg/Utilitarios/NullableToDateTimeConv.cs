using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using Xamarin.Forms;

namespace Sigre.App.Utilitarios
{
    public class NullableToDateTimeConv : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            var nullable = value as DateTime?;
            var result = string.Empty;

            if (nullable.HasValue)
            {
                result = nullable.Value.ToString();
            }

            return result;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            var stringValue = value.ToString();
            DateTime intValue;
            DateTime? result = null;

            if (DateTime.TryParse(stringValue, out intValue))
            {
                result = new Nullable<DateTime>(intValue);
            }

            return result;
        }
    }
}
