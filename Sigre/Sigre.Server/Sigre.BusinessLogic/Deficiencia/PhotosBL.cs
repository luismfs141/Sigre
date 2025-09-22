using Microsoft.EntityFrameworkCore.Query.Internal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.BusinessLogic.Deficiencia
{
    public class PhotosBL
    {
        public void FixPhotosPath(string basePath)
        {
            var directories = Directory.GetDirectories(basePath);

            foreach (var d in directories.Take(1)) 
            {
                var lastIndexOfSlash = d.LastIndexOf('\\');

                var newDirectory =  d.Substring(0, lastIndexOfSlash) + "\\jeje";
                Directory.Move(d, newDirectory);
            }
        }
    }
}
 