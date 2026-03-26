//using Microsoft.AspNetCore.Mvc;
//using Sigre.DataAccess.Context;

//namespace Sigre.Server.Controllers
//{
//    public class MigracionController : Controller
//    {
//        [Route("api/[controller]")]
//        [ApiController]
//        public class MigracionController : ControllerBase
//        {
//            // Flag estático para toda la aplicación. Evita que dos usuarios o clics dobles 
//            // lancen la migración masiva al mismo tiempo y saturen la base de datos.
//            private static bool _isMigrating = false;

//            [HttpPost("start")]
//            public IActionResult StartMigration()
//            {
//                if (_isMigrating)
//                {
//                    // Código 423 Locked: Indica que el recurso ya está en uso
//                    return StatusCode(423, new { success = false, message = "La migración masiva ya está en ejecución." });
//                }

//                _isMigrating = true;

//                // Instanciamos tu clase de Datos (DAL) siguiendo tu arquitectura
//                var daMigracion = new DAMigracion();

//                // 🔥 AQUÍ ESTÁ EL TRUCO SENIOR: Task.Run lanza el proceso en un hilo secundario
//                // y permite que el método retorne el "Ok" al frontend inmediatamente.
//                Task.Run(async () =>
//                {
//                    try
//                    {
//                        // Llamamos al método que hará el bucle de lotes
//                        await daMigracion.EjecutarMigracionMasivaAsync();
//                    }
//                    catch (Exception ex)
//                    {
//                        // Aquí deberías guardar en tu tabla de logs o archivo de texto
//                        Console.WriteLine($"Error crítico en el hilo de migración: {ex.Message}");
//                    }
//                    finally
//                    {
//                        // Siempre liberamos el flag al terminar (sea por éxito o error)
//                        _isMigrating = false;
//                    }
//                });

//                // Retornamos al instante para que PrimeReact muestre el Toast de "Iniciado"
//                return Ok(new { success = true, message = "Proceso de migración iniciado en background." });
//            }

//            [HttpGet("errors")]
//            public IActionResult GetErrors()
//            {
//                try
//                {
//                    var daMigracion = new DAMigracion();
//                    var errores = daMigracion.ObtenerErroresMigracion();

//                    // PrimeReact espera directamente un array (lista) de objetos para llenar la tabla
//                    return Ok(errores);
//                }
//                catch (Exception ex)
//                {
//                    return StatusCode(500, new { success = false, mensaje = "Error interno al obtener logs", detalle = ex.Message });
//                }
//            }
//        }
//    }
//}
