using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore; // 👈 importante si usas EF
using Microsoft.IdentityModel.Tokens;
using Sigre.DataAccess;              // 👈 tu namespace real para DAUser y SigreContext
using Sigre.DataAccess.Context;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Servicios
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 🔑 Configuración de JWT
var key = Encoding.UTF8.GetBytes("esta_es_una_clave_super_segura_123456!");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "SigreAPI",
        ValidAudience = "SigreMobile",
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// ⚡ Registrar tu DbContext (ajusta el nombre de la cadena)
builder.Services.AddDbContext<SigreContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ⚡ Registrar tus clases personalizadas
builder.Services.AddScoped<DAUser>();

var app = builder.Build();

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();