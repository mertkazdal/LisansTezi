using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Configuration ---
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "moodlens_default_secret_key_32chars!!";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "MoodLens";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "MoodLensApp";
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL") ?? "Host=localhost;Port=5432;Database=moodlens;Username=postgres;Password=password";
var aiServiceUrl = Environment.GetEnvironmentVariable("AI_SERVICE_URL") ?? "http://localhost:8000";
var aiServiceTimeoutSeconds = int.TryParse(Environment.GetEnvironmentVariable("AI_SERVICE_TIMEOUT_SECONDS"), out var configuredAiTimeout) &&
    configuredAiTimeout > 0
    ? configuredAiTimeout
    : 180;
var reasonCheckApiUrl = Environment.GetEnvironmentVariable("REASON_CHECK_API_URL");
var reasonCheckApiKey = Environment.GetEnvironmentVariable("REASON_CHECK_API_KEY");
var reasonCheckTimeoutSeconds = int.TryParse(Environment.GetEnvironmentVariable("REASON_CHECK_TIMEOUT_SECONDS"), out var configuredReasonTimeout) &&
    configuredReasonTimeout > 0
    ? configuredReasonTimeout
    : 20;
var applyMigrationsOnStartup = bool.TryParse(Environment.GetEnvironmentVariable("APPLY_MIGRATIONS_ON_STARTUP"), out var configuredApplyMigrations)
    ? configuredApplyMigrations
    : builder.Environment.IsDevelopment();

// --- Services ---

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(databaseUrl));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// HttpClient for AI Service
builder.Services.AddHttpClient("AiService", client =>
{
    client.BaseAddress = new Uri(aiServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(aiServiceTimeoutSeconds);
});

builder.Services.AddHttpClient("ReasonCheckService", client =>
{
    client.Timeout = TimeSpan.FromSeconds(reasonCheckTimeoutSeconds);
});

// Custom services
builder.Services.AddScoped<AuthService>(sp =>
    new AuthService(jwtSecret, jwtIssuer, jwtAudience));
builder.Services.AddScoped<AiServiceClient>();
builder.Services.AddScoped<AdminAccessService>();
builder.Services.AddScoped<GuestDataMergeService>();
builder.Services.AddScoped<AnalyticsService>();
builder.Services.AddScoped(sp =>
    new ReasonCheckClient(
        sp.GetRequiredService<IHttpClientFactory>(),
        reasonCheckApiUrl,
        reasonCheckApiKey
    ));

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MoodLens API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (applyMigrationsOnStartup)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

// --- Middleware ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "api-gateway"
}));
app.MapControllers();

app.Run();
