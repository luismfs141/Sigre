using Sigre.DataAccess.Context;
using Sigre.Entities.Entities;
using Sigre.Entities.Structs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Sigre.Entities.Entities.Structs;

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
                        ComentarioEstandar = cd.CodiComentarioEstandar ?? ""
                    }
                )
                );
            return query.ToList();
        }

        public List<TypificationStruct> DATIPI_GetByUser(int x_usuario_id)
        {
            using var ctx = new SigreContext();

            // Obtener el perfil del usuario
            int perfil = ctx.PerfilesUsuarios
                .Where(p => p.PfusInterno == x_usuario_id)
                .Select(p => p.PfusPerfil)
                .FirstOrDefault();

            if (perfil == 0)
                return new List<TypificationStruct>();

            // Obtener los códigos asociados al perfil
            var codigosPerfil = ctx.PerfilesCodigos
                .Where(pc => pc.PfcdPerfil == perfil)
                .Select(pc => pc.PfcdCodigo)
                .ToList();

            if (codigosPerfil == null || codigosPerfil.Count == 0)
                return new List<TypificationStruct>();

            // Consulta principal, filtrando solo los códigos del perfil
            var query = (
                from ti in ctx.Tipificaciones
                join cd in ctx.Codigos on ti.CodiInterno equals cd.CodiInterno
                join cm in ctx.Componentes on cd.CompInterno equals cm.CompInterno
                join tb in ctx.Tablas on cm.TablInterno equals tb.TablInterno
                where codigosPerfil.Contains(cd.CodiInterno) // 👈 filtro por códigos del perfil
                select new TypificationStruct
                {
                    TableId = tb.TablInterno,
                    Table = tb.TablNombre,
                    Component = cm.CompComponente,
                    Code = cd.CodiCodigo,
                    Typification = ti.TipoDescripcion,
                    TypificationId = ti.TipiInterno,
                    ComentarioEstandar = cd.CodiComentarioEstandar,
                }
            );

            return query.ToList();
        }

        public List<TypificationStruct> DATIPI_GetByBT()
        {
            using var ctx = new SigreContext();


            var query =
                from ti in ctx.Tipificaciones
                join cd in ctx.Codigos on ti.CodiInterno equals cd.CodiInterno
                join cm in ctx.Componentes on cd.CompInterno equals cm.CompInterno
                join tb in ctx.Tablas on cm.TablInterno equals tb.TablInterno
                where new[] { 6, 7, 8, 9 }.Contains(tb.TablInterno)
                select new TypificationStruct
                {
                    TableId = tb.TablInterno,
                    Table = tb.TablNombre,
                    Component = cm.CompComponente,
                    Code = cd.CodiCodigo,
                    Typification = ti.TipoDescripcion,
                    TypificationId = ti.TipiInterno,
                    Deficiency = cd.CodiDeficiencia,
                    ComentarioEstandar = cd.CodiComentarioEstandar,
                };

            return query.ToList();
        }


        public List<TypificationOptionStruct> DATIPI_GetOptionsByTipiInterno(int x_tipiInterno)
        {
            using var ctx = new SigreContext();

            if (x_tipiInterno <= 0)
                return new List<TypificationOptionStruct>();

            var query =
                from ti in ctx.Tipificaciones
                join co in ctx.CodigosOpciones on ti.CodiInterno equals co.CodiInterno
                where ti.TipiInterno == x_tipiInterno
                orderby co.CodopInterno
                select new TypificationOptionStruct
                {
                    CodopInterno = co.CodopInterno,
                    CodopOpcion = co.CodopOpcion,
                    CodopCol1 = co.CodopCol1,
                    CodopCol2 = co.CodopCol2
                };

            return query.ToList();
        }

    }
}
