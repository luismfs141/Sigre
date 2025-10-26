using Microsoft.AspNetCore.Mvc;
using Sigre.DataAccess;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly DAUser _daUser;
    private readonly IConfiguration _config;


    public AuthController(DAUser daUser, IConfiguration config)
    {
        _daUser = daUser;
        _config = config;
    }

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
}

public class LoginRequest
{
    public string Correo { get; set; }
    public string Password { get; set; }
    public string? Imei { get; set; }
}
