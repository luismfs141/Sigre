using Sigre.DataAccess.Context;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sigre.DataAccess
{
    public class DATypification
    {
        public List<TypificationStruct> DATIPI_GetAll()
        {
            SigreContext ctx = new SigreContext();

            var query = (
                from ti in ctx.Tipificaciones
                join cd in ctx.Codigos on ti.CodiInterno equals cd.CodiInterno
                join cm in ctx.Componentes on cd.CompInterno equals cm.CompInterno
                join tb in ctx.Tablas on cm.TablInterno equals tb.TablInterno
                select (
                    new TypificationStruct()
                    {
                        TableId = tb.TablInterno,
                        Table = tb.TablNombre,
                        Component = cm.CompComponente,
                        Code = cd.CodiCodigo,
                        Typification = ti.TipoDescripcion,
                        TypificationId = ti.TipiInterno,
                    }
                )
                );
            return query.ToList();
        }
    }
}
