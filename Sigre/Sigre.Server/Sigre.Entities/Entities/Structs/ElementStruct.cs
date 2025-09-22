using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.Entities.Entities.Structs
{
    public class ElementStruct
    {
        [Key] public int StructId { get; set; }
        public string FeederCode { get; set; }
        public string FeederLabel { get; set; }
        public int ElementId { get; set; }
        public string ElementType { get; set; }
        public string TypificationCode { get; set; }
        public string CodINS { get; set; }
        public string Label { get; set; }
        public int PhotosQuantity { get; set; }
        public string PhotosPath { get; set;}
        public string SedType { get; set; }
        public  string StartNode { get; set; }
        public string EndNode { get; set;}
        public string ElementMaterial { get; set;}
        public string HeldType { get; set; }
        public string Supply { get; set; }
        public decimal DistHorizontal { get; set; }
        public decimal DistVertical { get; set; }
        public string ArmedType { get; set; }
        public string ArmedMaterial { get; set; }
        public string Subsanacion { get; set; }
        public int PostNum { get; set; }
        public int ElementCritical { get; set; }
        public string DeficiencyCode { get; set; }
        public string Users{ get; set; }
        public string Origin { get; set; }
        public string DenunciationDate { get; set;}
        public string InspectionDate { get; set;}
        public string RectificationDate { get; set;}
        public string RegistrationDate { get; set; }
        public string ModificationDate { get; set;}
        public string Observation { get; set;}
        public string Comment { get; set;}
        public string Well1 { get; set;}
        public string Well2 { get; set;}
        public bool Responsible { get; set;}
    }
}
