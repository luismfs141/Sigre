//using Sigre.DataAccess.Context;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace Sigre.DataAccess
//{
//    public class DAMigracion
//    {
//        // Variables de entorno o configuración (Web.config / appsettings.json)
//        private readonly string bucketName = "tu-bucket-aws-s3";
//        private readonly string basePathLocal = @"C:\Ruta\Base\A\Tus\Fotos\";

//        // Método principal que manejará el bucle
//        public async Task EjecutarMigracionMasivaAsync()
//        {
//            bool hayRegistros = true;
//            while (hayRegistros)
//            {
//                hayRegistros = await ProcesarLoteAsync();
//            }
//        }

//        // Procesa un solo lote de 500 fotos
//        private async Task<bool> ProcesarLoteAsync()
//        {
//            using (var ctx = new SigreContext())
//            {
//                // 1. Obtener 500 pendientes
//                var lote = ctx.Archivos
//                              .Where(a => a.MigrationStatus == "PENDIENTE")
//                              .Take(500)
//                              .ToList();

//                if (!lote.Any()) return false; // Ya no hay más, salir del bucle

//                // Configurar cliente de S3 (idealmente toma las credenciales del appsettings)
//                using (var s3Client = new AmazonS3Client(Amazon.RegionEndpoint.USEast1))
//                {
//                    foreach (var archivo in lote)
//                    {
//                        string localPath = Path.Combine(basePathLocal, archivo.ARCH_Nombre);
//                        // ¡Aquí es donde generas la llave (link) de S3!
//                        string s3Key = $"fotos/{archivo.DEFI_UUID}/{archivo.ARCH_Interno}.jpg";

//                        try
//                        {
//                            // 2. Subir a S3
//                            var putRequest = new PutObjectRequest
//                            {
//                                BucketName = bucketName,
//                                Key = s3Key,
//                                FilePath = localPath, // AWS SDK lee el archivo físico automáticamente
//                                ContentType = "image/jpeg"
//                            };

//                            await s3Client.PutObjectAsync(putRequest);

//                            // 3. Actualizar BD a éxito y GUARDAR LA S3KEY (EL LINK)
//                            archivo.MigrationStatus = "MIGRADO";
//                            archivo.S3_ObjectKey = s3Key;
//                            ctx.SaveChanges();
//                        }
//                        catch (Exception ex)
//                        {
//                            // 4. Actualizar BD a error
//                            archivo.MigrationStatus = "ERROR";
//                            ctx.SaveChanges();

//                            // Guardar log detallado
//                            var log = new MigrationLog
//                            {
//                                ArchivoID = archivo.ID,
//                                ErrorMessage = ex.Message.Substring(0, Math.Min(ex.Message.Length, 500)),
//                                FechaLog = DateTime.Now
//                            };
//                            ctx.MigrationLogs.Add(log);
//                            ctx.SaveChanges();
//                        }
//                    }
//                }
//                return true; // Retorna true para que el while() busque el siguiente lote
//            }
//        }

//        // Método para llenar la tabla de PrimeReact
//        public object ObtenerErroresMigracion()
//        {
//            using (var ctx = new SigreContext())
//            {
//                var query = from a in ctx.Archivos
//                            join m in ctx.MigrationLogs on a.ID equals m.ArchivoID
//                            where a.MigrationStatus == "ERROR"
//                            orderby m.FechaLog descending
//                            select new
//                            {
//                                a.ARCH_Interno,
//                                a.DEFI_UUID,
//                                ErrorMessage = m.ErrorMessage,
//                                FechaLog = m.FechaLog.ToString("yyyy-MM-dd HH:mm:ss")
//                            };

//                return query.ToList();
//            }
//        }
//    }
//}
