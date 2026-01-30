using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Sigre.DataAccess;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;


namespace Sigre.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly DAUser _daUser;
        private readonly IConfiguration _config;
        private static bool IsDuplicateCorreo(string msg)
        {
            if (string.IsNullOrWhiteSpace(msg)) return false;

            // Detecta los textos típicos de SQL Server cuando rompe UNIQUE index
            // y además valida que sea el índice de correo.
            var hasIndex = msg.Contains("UX_Usuarios_Correo", StringComparison.OrdinalIgnoreCase);
            var looksDuplicate =
                msg.Contains("duplicate", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("Violation", StringComparison.OrdinalIgnoreCase);

            return hasIndex && looksDuplicate;
        }


        public UserController(DAUser daUser, IConfiguration config)
        {
            _daUser = daUser;
            _config = config;
        }

        // 🔐 LOGIN
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (request == null)
                return BadRequest(new { message = "Body vacío" });

            request.Correo = request.Correo?.Trim();
            request.Password = request.Password?.Trim();

            if (string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Correo y password son obligatorios" });

            var usuario = _daUser.DAUS_LoginUser(request.Correo, request.Password, request.Imei);

            if (usuario == null)
                return Unauthorized(new { message = "Credenciales inválidas" });

            // ✅ BLOQUEO: desactivado NO puede iniciar sesión
            if (usuario.UsuaActivo == false)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Usuario desactivado" });

            // ✅ Perfil desde servidor (fuente de verdad)
            var perfil = _daUser.DAUS_GetPerfilByUser(usuario.UsuaInterno);

            var claims = new[]
            {
        new Claim(JwtRegisteredClaimNames.Sub, usuario.UsuaCorreo),
        new Claim("usuarioId", usuario.UsuaInterno.ToString()),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("esta_es_una_clave_super_segura_123456!"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "SigreAPI",
                audience: "SigreMobile",
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds);

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                usuario.UsuaInterno,
                usuario.UsuaNombres,
                usuario.UsuaApellidos,
                usuario.UsuaCorreo,

                perfilId = perfil?.PerfInterno,
                perfilNombre = perfil?.PerfNombre
            });
        }



        // 👥 OBTENER LISTA DE USUARIOS
        [HttpGet("users")]
        public ActionResult<List<UsuarioListDto>> GetUsuarios()
        {
            try
            {
                var usuarios = _daUser.DAUS_GetUsersWithProfile();
                if (usuarios == null || !usuarios.Any())
                    return NotFound(new { message = "No hay usuarios registrados." });

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener los usuarios.", error = ex.Message });
            }
        }

        [HttpPost("setactive")]
        public IActionResult SetActive([FromBody] UserActiveRequest request)
        {
            try
            {
                _daUser.DAUS_SetUserActive(request.UsuarioId, request.Activo);
                return Ok(new { message = "Estado de usuario actualizado correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class UserActiveRequest
        {
            public int UsuarioId { get; set; }
            public bool Activo { get; set; }
        }


        // 🧩 OBTENER LISTA DE PERFILES
        [HttpGet("profiles")]
        public ActionResult<List<Perfile>> GetPerfiles()
        {
            try
            {
                var perfiles = _daUser.DAUS_GetProfiles();
                if (perfiles == null || !perfiles.Any())
                    return NotFound(new { message = "No hay perfiles registrados." });

                return Ok(perfiles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener los perfiles.", error = ex.Message });
            }
        }

        [HttpPost("save")]
        public IActionResult SaveUser([FromBody] UsuarioRequest request)
        {
            try
            {
                var perfiles =
                    (request.Perfiles != null && request.Perfiles.Count > 0)
                        ? request.Perfiles
                        : (request.PerfilId.HasValue && request.PerfilId.Value > 0
                            ? new List<int> { request.PerfilId.Value }
                            : new List<int>());

                if (perfiles.Count == 0)
                    return BadRequest(new { message = "Seleccione un perfil." });

                var usuario = new Usuario
                {
                    UsuaInterno = request.UsuaInterno,
                    UsuaNombres = request.UsuaNombres,
                    UsuaApellidos = request.UsuaApellidos,
                    UsuaCorreo = request.UsuaCorreo,
                    UsuaPassword = request.UsuaPassword,
                    UsuaActivo = request.UsuaActivo
                };

                _daUser.DAUS_SaveUser(usuario, perfiles);

                return Ok(new { message = "Usuario guardado correctamente" });
            }
            catch (Exception ex)
            {
                // ✅ Mensaje real del motor (SQL) pero solo para detectar el caso
                var baseMsg = ex.GetBaseException()?.Message ?? ex.Message;

                // ✅ DUPLICADO DE CORREO (indice único UX_Usuarios_Correo)
                if (IsDuplicateCorreo(baseMsg))
                {
                    // 409 = conflicto (dato ya existe)
                    return Conflict(new
                    {
                        message = "El correo ya está registrado. Use otro correo para continuar.",
                        code = "DUPLICATE_EMAIL"
                    });
                }

                // ✅ Cualquier otro error: mensaje profesional (sin filtrar info interna)
                return BadRequest(new
                {
                    message = "No se pudo guardar el usuario. Verifique los datos e intente nuevamente.",
                    code = "SAVE_USER_ERROR"
                });
            }

        }



        [HttpPost("savefeeders")]
        public IActionResult SaveUserFeeders([FromBody] UserFeedersRequest request)
        {
            try
            {
                DAUser dAUser = new DAUser();
                dAUser.DAUS_SaveUserFeeders(request.UsuarioId, request.Alimentadores);
                return Ok(new { message = "Alimentadores guardados correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // Clase auxiliar para login
    public class LoginRequest
    {
        public string Correo { get; set; }
        public string Password { get; set; }
        public string? Imei { get; set; }
    }

    public class UserFeedersRequest
    {
        public int UsuarioId { get; set; }
        public List<int> Alimentadores { get; set; } = new();
    }


}