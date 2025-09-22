
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Structs
{
    public class TypificationStruct
    {
        public string Label
        {
            get
            {
                return string.Concat(Table, "-", Component, "-", Code, "-", Typification);
            }
            set
            {
            }
        }
        public int TableId { get; set; }
        public string Table { get; set; }
        public string Component { get; set; }
        public string Code { get; set; }
        public string Typification { get; set; }
        public int TypificationId { get; set; }
    }
}
