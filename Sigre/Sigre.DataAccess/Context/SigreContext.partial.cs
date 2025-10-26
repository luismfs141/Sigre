using Microsoft.EntityFrameworkCore;
using Sigre.Entities.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess.Context
{
    public partial class SigreContext : DbContext
    {
        public virtual DbSet<ElementStruct>ElementStructs { get; set; }

        public DbSet<DeficiencyDto> DeficiencyDto { get; set; }
    }
}
