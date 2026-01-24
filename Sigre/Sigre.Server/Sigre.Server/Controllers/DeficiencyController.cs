using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Sigre.DataAccess;
using Sigre.Entities;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using Sigre.Entities.Entities.SyncData;
using Sigre.Entities.Structs;

namespace Sigre.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeficiencyController : Controller
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

        [HttpPost("SyncFromSQLite")]
        public IActionResult SyncFromSQLite([FromBody] List<DeficienciaSyncDto> deficienciasOffline)
        {
            DADeficiency dADeficiency = new DADeficiency();

            if (deficienciasOffline == null || deficienciasOffline.Count == 0)
                return Ok(new List<object>());

            var result = dADeficiency.DADefi_SyncFromSQLite(deficienciasOffline);

            var response = result.Select(r => new
            {
                localId = r.localId,
                serverId = r.serverId
            });

            return Ok(response);
        }

        [HttpGet("GetById")]
        public IActionResult GetById(int x_defiInterno)
        {
            DADeficiency dADeficiency = new DADeficiency();

            var deficiencia = dADeficiency.DADEFI_GetById(x_defiInterno);

            if (deficiencia == null)
            {
                return NotFound(new
                {
                    estado = "Error",
                    mensaje = "No se encontró la deficiencia con el ID proporcionado"
                });
            }

            return Ok(deficiencia);
        }
        [HttpGet("GetByGis")]
        public IActionResult GetByGis(string codigoGis)
        {
            try
            {
                // Instanciamos tu capa de datos
                DADeficiency da = new DADeficiency();

                // Llamamos al método que creamos
                List<Deficiencia> resultado = da.DADEFI_GetByCodigoGis(codigoGis);

                // Retornamos 200 OK con la lista (aunque esté vacía)
                return Ok(resultado);
            }
            catch (System.Exception ex)
            {
                // En caso de error, retornamos 400 o 500
                return BadRequest($"Error al buscar por código GIS: {ex.Message}");
            }
        }
        [HttpGet("GetBySed")]
        public IActionResult GetBySed(int x_sed)
        {
            try
            {
                // Validación básica
                if (x_sed <= 0)
                {
                    return BadRequest(new
                    {
                        estado = "Error",
                        mensaje = "El ID de la SED debe ser mayor a 0."
                    });
                }

                DADeficiency da = new DADeficiency();

                // Llamamos al nuevo método singular
                var resultado = da.DADEFI_GetBySed(x_sed);

                return Ok(resultado);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new
                {
                    estado = "Error",
                    mensaje = $"Error al buscar por SED: {ex.Message}"
                });
            }
        }

    }
}
