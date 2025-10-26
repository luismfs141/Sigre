using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeficiencyController
    {
        [Route("save")]
        [HttpPost]
        public object Save(Deficiencia x_deficiencia)
        {
            DADeficiency dADeficiency = new DADeficiency();
            dADeficiency.DADEFI_Save(x_deficiencia);

            return new
            {
                id = x_deficiencia.DefiInterno,
                estado = "Satisfactorio",
                Mensaje = "Se guardó correctamente"
            };
        }

        [Route("inspected")]
        [HttpPost]
        public object DeficiencyInspected(int x_id)
        {
            DADeficiency dADeficiency = new DADeficiency();
            dADeficiency.DADEFI_DeficiencyInspected(x_id);

            return new
            {
                id = x_id,
                estado = "Satisfactorio",
                Mensaje = "Se guardó correctamente"
            };
        }

        [Route("delete")]
        [HttpPost]
        public object Delete(Deficiencia x_deficiencia)
        {
            DADeficiency dADeficiency = new DADeficiency();
            dADeficiency.DADEFI_Delete(x_deficiencia);

            return new
            {
                id = x_deficiencia.DefiInterno,
                estado = "Satisfactorio",
                Mensaje = "Se eliminó correctamente"
            };
        }

        [HttpGet("GetByElement")]
        public List<Deficiencia> GetByElement(ElectricElement x_elementType, int x_ElementId)
        {
            DADeficiency dADeficiency = new DADeficiency();

            return dADeficiency.DADEFI_GetByElement(x_elementType, x_ElementId);
        }

        [HttpGet("GetByFeeder")]
        public List<Deficiencia> GetByFeeder(int x_feeder_id)
        {
            DADeficiency dADeficiency = new DADeficiency();

            return dADeficiency.DADEFI_GetByFeeder(x_feeder_id);
        }

        [HttpPost("GetDeficienciesByFeeders")]
        public List<Deficiencia> GetByListFeeder([FromBody] List<int> feeders)
        {
            DADeficiency dADeficiency = new DADeficiency();

            return dADeficiency.DADEFI_GetByListFeeders(feeders);
        }

        [Route("SynchronizeData")]
        [HttpPost]
        public object SyncronizeData(OffLineStruct off)
        {
            DADeficiency dADeficiency = new DADeficiency();
            dADeficiency.DADEFI_SaveDeficienciesAndFiles(off);
            return new
            {
                estado = "Satisfactorio",
                Mensaje = "Se eliminó correctamente"
            };
        }
    }
}
