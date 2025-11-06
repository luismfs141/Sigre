using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sigre.DataAccess;
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

// ⚡ Registrar DbContext
builder.Services.AddDbContext<SigreContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ⚡ Registrar tus clases personalizadas
builder.Services.AddScoped<DAUser>();

// 🔥 Agregar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost3000", policy =>
    {
        policy.WithOrigins("http://localhost:3000")  // origen del front React
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ✅ Usa la política CORS antes de Authentication/Authorization
app.UseCors("AllowLocalhost3000");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();