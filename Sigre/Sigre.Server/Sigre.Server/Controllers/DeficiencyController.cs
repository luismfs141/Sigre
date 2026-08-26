using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OfficeOpenXml;
using Sigre.BusinessLogic.Principal;
using Sigre.BusinessLogic.Utilidades;
using Sigre.DataAccess;
using Sigre.DataAccess.Context;
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
            try
            {
                if (deficienciasOffline == null || deficienciasOffline.Count == 0)
                    return Ok(new List<object>());

                DADeficiency daDeficiency = new DADeficiency();
                var result = daDeficiency.DADefi_SyncFromSQLite(deficienciasOffline);

                return Ok(result.Select(r => new
                {
                    localId = r.localId,
                    serverId = r.serverId
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
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
        [HttpPost("SoftDelete")]
        public IActionResult SoftDelete(int id) 
        {
            try
            {
                // 1. Validación básica
                if (id <= 0)
                {
                    return BadRequest(new
                    {
                        estado = "Error",
                        mensaje = "El ID debe ser válido."
                    });
                }

                DADeficiency da = new DADeficiency();


                bool exito = da.DADEFI_SoftDelete(id);

                if (exito)
                {
                    return Ok(new
                    {
                        estado = "OK",
                        mensaje = "Eliminado correctamente."
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        estado = "Error",
                        mensaje = "No se encontró el registro."
                    });
                }
            }
            catch (System.Exception ex)
            {
                return BadRequest(new
                {
                    estado = "Error",
                    mensaje = $"Error interno: {ex.Message}"
                });
            }
        }

        
            [HttpPost("saveOrUpdateWeb")]
            public IActionResult SaveOrUpdateWeb([FromBody] Deficiencia input)
            {
                if (input == null) return BadRequest("No se recibieron datos.");

                try
                {
                    // Instanciamos la capa de datos
                    DADeficiency da = new DADeficiency();

                    // Llamamos al método único que decide si guarda o edita
                    int idResultado = da.DADEFI_SaveOrUpdateWeb(input);

                    return Ok(new { message = "Operación exitosa", id = idResultado });
                }
                catch (Exception ex)
                {
                    // Manejo de errores (Loguear ex.Message si es necesario)
                    return BadRequest($"Error al guardar: {ex.Message}");
                }
            }
        [HttpGet("reporte-sed/{sedInterno}")]
        public IActionResult ObtenerReportePorSubestacion(int sedInterno)
        {
            try
            {
                // 1. Validación de seguridad básica
                if (sedInterno <= 0)
                {
                    return BadRequest(new { mensaje = "El ID de la Subestación (sed_interno) no es válido." });
                }

                // 2. Instancia de la Capa de Datos
                // (Mantenemos tu patrón de instanciación directa)
                DADeficiency da = new DADeficiency();

                // 3. Llamada al método corregido
                // Esto devolverá: { postes: [...], vanos: [...] }
                var resultado = da.DADEFI_ObtenerReportePorSED(sedInterno);

                // 4. Retorno de la respuesta
                // ASP.NET Core serializará automáticamente el objeto anónimo a JSON
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                // Log de error (importante para producción)
                Console.WriteLine($"[ERROR] Controller Reporte SED {sedInterno}: {ex.Message}");

                // Devolvemos 500 pero con un mensaje controlado
                return StatusCode(500, new
                {
                    mensaje = "Ocurrió un error interno al generar el reporte.",
                    error = ex.Message
                });
            }
        }

        [HttpPost("Restaurar")]
        public IActionResult Restaurar(int id)
        {
            try
            {
                if (id <= 0) return BadRequest(new { estado = "Error", mensaje = "ID inválido." });

                DADeficiency da = new DADeficiency();
                bool exito = da.DADEFI_Restaurar(id);

                if (exito)
                {
                    return Ok(new { estado = "OK", mensaje = "Registro restaurado correctamente." });
                }
                else
                {
                    return BadRequest(new { estado = "Error", mensaje = "No se encontró el registro." });
                }
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { estado = "Error", mensaje = $"Error interno: {ex.Message}" });
            }
        }
        
        [HttpGet("GetBySedWithTerceros")]
        public IActionResult GetBySedWithTerceros(int x_sedId)
        {
            try
            {
                var da = new DADeficiency();

                // Llamamos EXCLUSIVAMENTE al método nuevo
                var lista = da.DADEFI_GetBySed_ConEstadoTerceros(x_sedId);

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return BadRequest("Error al obtener deficiencias: " + ex.Message);
            }
        }
        public class EstadoTerceroDto
        {
            public int DefiInterno { get; set; } // El ID de la fila que seleccionaste en la tabla
            public bool EsTercero { get; set; }  // true (No existe/Rojo) o false (Existe/Verde)
        }

        [HttpPost("CambiarEstadoTercero")]
        public IActionResult CambiarEstadoTercero([FromBody] EstadoTerceroDto modelo)
        {
            try
            {
                var da = new DADeficiency();

                // Llamamos al método "Quirúrgico" (SQL Raw) que creamos
                // Si mandas modelo.EsTercero = true  --> Lo marca como eliminado (1)
                // Si mandas modelo.EsTercero = false --> Lo restaura (0)
                bool exito = da.DADEFI_CambiarEstadoTerceroDesdeDeficiencia(modelo.DefiInterno, modelo.EsTercero);

                if (exito)
                {
                    string accion = modelo.EsTercero ? "marcado como NO EXISTE" : "RESTAURADO a campo";
                    return Ok(new { message = $"Elemento {accion} correctamente." });
                }
                else
                {
                    return NotFound(new { message = "No se pudo actualizar. Verifica que la deficiencia exista y tenga un elemento asociado." });
                }
            }
            catch (Exception ex)
            {
                return BadRequest("Error interno: " + ex.Message);
            }
        }
        [HttpGet("GetInfoTecnica")]
        public async Task<IActionResult> GetInfoTecnica(string codigo) // <--- Solo recibe 'codigo'
        {
            // Validación básica
            if (string.IsNullOrEmpty(codigo)) return BadRequest(new { msg = "Código requerido" });

            var dao = new DADeficiency();
            // Llamamos al método nuevo que solo pide código
            var resultado = await dao.DADEFI_GetInfoTecnicaAsync(codigo);

            if (resultado == null) return NotFound(new { msg = "Elemento no encontrado en GIS" });

            return Ok(resultado);
        }
        [HttpPost("ActualizarFichaTecnica")]
        public async Task<IActionResult> ActualizarFichaTecnica([FromBody] UpdateFichaTecnicaDto dto)
        {
            // 1. Validaciones básicas de entrada
            if (dto == null || dto.DefiInterno <= 0)
            {
                return BadRequest(new { success = false, message = "Datos inválidos o incompletos." });
            }

            try
            {
                // 2. Instanciamos la capa de datos
                var dao = new DADeficiency();

                // 3. Ejecutamos la actualización unificada
                bool resultado = await dao.DADEFI_ActualizarFichaTecnicaAsync(dto);

                // 4. Respondemos según el resultado
                if (resultado)
                {
                    return Ok(new { success = true, message = "Ficha técnica actualizada correctamente." });
                }
                else
                {
                    // Si devuelve false, es probable que la deficiencia no exista o no tenga elemento asociado
                    return NotFound(new { success = false, message = "No se encontró el elemento asociado a la deficiencia." });
                }
            }
            catch (Exception ex)
            {
                // 5. Manejo de errores no controlados (Logs)
                // Console.WriteLine(ex.Message); // Descomentar si usas logs de consola
                return StatusCode(500, new { success = false, message = "Error interno del servidor: " + ex.Message });
            }
        }
        [HttpGet("del-dia-paginado")]
        public async Task<IActionResult> GetDeficienciasDelDiaPaginado([FromQuery] int skip, [FromQuery] int take, [FromQuery] DateTime fecha)
        {
            try
            {
                var daDeficiency = new DADeficiency();

                // Llamamos al método que creamos arriba
                var result = await daDeficiency.ObtenerDeficienciasDelDiaPaginadoAsync(skip, take, fecha);

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno al paginar deficiencias del día", detalle = ex.Message });
            }
        }
        [HttpGet("estadisticas-inspectores")]
        public async Task<IActionResult> GetEstadisticasInspectores([FromQuery] DateTime fecha)
        {
            try
            {
                var daDeficiency = new DADeficiency();
                var result = await daDeficiency.ObtenerEstadisticasInspectoresDelDiaAsync(fecha);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno", detalle = ex.Message });
            }
        }
        [HttpGet("EstadisticasCalidad")]
        public IActionResult GetEstadisticasCalidad([FromQuery] int sedId, [FromQuery] string sedCodigo)
        {
            try
            {
                // Instanciar tu clase de Datos (DAL)
                var daDefi = new DADeficiency(); // Ajusta el nombre si tu clase se llama diferente

                // Llamar al método que construimos (si lo hiciste async, ponle el 'await' y cambia la firma)
                var estadisticas = daDefi.DADEFI_GetEstadisticasCalidad(sedId, sedCodigo);

                return Ok(new { success = true, data = estadisticas });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    mensaje = "Error interno al generar estadísticas",
                    detalle = ex.Message
                });
            }
        }
        [HttpPost("clone")]
        public async Task<IActionResult> CloneDeficiency([FromBody] CloneDeficiencyRequest request)
        {
            // 1. Validación básica de entrada
            if (request.IdOriginal <= 0)
            {
                return BadRequest(new { mensaje = "El ID de la deficiencia original es inválido." });
            }

            try
            {
                // Instanciamos tu capa DA de Deficiencias
                var daDeficiency = new DADeficiency();

                // 2. Ejecutamos el motor de clonación (BD + Archivos Físicos)
                // Nota: Asegúrate de que DADEFI_ClonarWeb tenga firma 'async Task<int>' 
                // ya que por dentro llama a CopiarArchivoFisicoAsync
                int nuevoIdDeficiencia = await daDeficiency.DADEFI_ClonarWeb(
                    request.IdOriginal,
                    request.NuevaTipificacion,
                    request.NuevoCodigoTipi,
                    request.UsuarioSesion
                );

                return Ok(new
                {
                    mensaje = "Deficiencia y evidencias clonadas con éxito.",
                    nuevoId = nuevoIdDeficiencia
                });
            }
            catch (ArgumentException ex)
            {
                // Capturamos las reglas de negocio (ej. "No puede registrar SIN DEFICIENCIA")
                return BadRequest(new { mensaje = "Operación bloqueada por regla de negocio", detalle = ex.Message });
            }
            catch (FileNotFoundException ex)
            {
                // Si falló la copia física
                return NotFound(new { mensaje = "Error en evidencias", detalle = ex.Message });
            }
            catch (Exception ex)
            {
                // Cualquier otro error (ej. SQL Server abajo)
                return StatusCode(500, new { mensaje = "Error interno al clonar la deficiencia", detalle = ex.Message });
            }
        }

        [HttpPost("list-from-excel")]
        [Consumes("multipart/form-data")]
        public ActionResult<List<DeficiencyResult>> ListFromExcel(
            IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Debe enviar un archivo Excel.");

            using var stream = file.OpenReadStream();

            ExcelPackage.License.SetNonCommercialOrganization("SIGRE");

            using var package = new ExcelPackage(stream);

            var blDefciency = new BLDefciency();

            var resultado = blDefciency.LeerReporte(package.Workbook);

            return Ok(resultado);
        }
    }
}
