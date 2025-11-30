using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Sigre.DataAccess;
using Sigre.Entities.Entities;
using Sigre.Entities.Entities.Structs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Sigre.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly DAUser _daUser;
        private readonly IConfiguration _config;

        public UserController(DAUser daUser, IConfiguration config)
        {
            _daUser = daUser;
            _config = config;
        }

        // 🔐 LOGIN
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var usuario = _daUser.DAUS_LoginUser(request.Correo, request.Password, request.Imei);

            if (usuario == null)
                return Unauthorized(new { message = "Credenciales inválidas" });

            // Crear token JWT
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
                usuario.UsuaApellidos
            });
        }

        // 👥 OBTENER LISTA DE USUARIOS
        [HttpGet("users")]
        public ActionResult<List<Usuario>> GetUsuarios()
        {
            try
            {
                var usuarios = _daUser.DAUS_GetUsers();
                if (usuarios == null || !usuarios.Any())
                    return NotFound(new { message = "No hay usuarios registrados." });

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener los usuarios.", error = ex.Message });
            }
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
                var usuario = new Usuario
                {
                    UsuaInterno = request.UsuaInterno,
                    UsuaNombres = request.UsuaNombres,
                    UsuaApellidos = request.UsuaApellidos,
                    UsuaCorreo = request.UsuaCorreo,
                    UsuaPassword = request.UsuaPassword,
                    UsuaActivo = request.UsuaActivo
                };

                _daUser.DAUS_SaveUser(usuario, request.Perfiles);

                return Ok(new { message = "Usuario guardado correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
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