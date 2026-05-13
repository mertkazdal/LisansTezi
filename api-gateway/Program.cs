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
builder.Services.AddSingleton<AnalysisCooldownService>();
builder.Services.AddSingleton<GuestAnalysisStore>();
builder.Services.AddSingleton<GuestIdentityService>();
builder.Services.AddScoped<AdminAccessService>();
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
    await EnsureInitialMigrationBaselineAsync(dbContext);
    dbContext.Database.Migrate();
    await EnsureRuntimeSchemaAsync(dbContext);
}
else
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await EnsureRuntimeSchemaAsync(dbContext);
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

static async Task EnsureInitialMigrationBaselineAsync(AppDbContext dbContext)
{
    await dbContext.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
            "MigrationId" character varying(150) NOT NULL,
            "ProductVersion" character varying(32) NOT NULL,
            CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
        );

        DO $$
        BEGIN
            IF to_regclass('public.users') IS NOT NULL
                AND to_regclass('public.emotion_history') IS NOT NULL
                AND to_regclass('public.recommendations') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM "__EFMigrationsHistory"
                    WHERE "MigrationId" = '20260429225652_InitialSchema'
                )
            THEN
                CREATE TABLE IF NOT EXISTS analysis_feedback (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    history_id uuid NOT NULL REFERENCES emotion_history(id) ON DELETE CASCADE,
                    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
                    guest_session_id text,
                    overall_rating integer NOT NULL,
                    analysis_accuracy_rating integer NOT NULL,
                    recommendation_quality_rating integer NOT NULL,
                    helpful boolean NOT NULL DEFAULT false,
                    would_reuse boolean NOT NULL DEFAULT false,
                    comment text,
                    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT CK_analysis_feedback_overall_rating CHECK (overall_rating BETWEEN 1 AND 5),
                    CONSTRAINT CK_analysis_feedback_accuracy_rating CHECK (analysis_accuracy_rating BETWEEN 1 AND 5),
                    CONSTRAINT CK_analysis_feedback_recommendation_rating CHECK (recommendation_quality_rating BETWEEN 1 AND 5)
                );

                CREATE UNIQUE INDEX IF NOT EXISTS IX_analysis_feedback_history_id
                    ON analysis_feedback(history_id);
                CREATE INDEX IF NOT EXISTS IX_analysis_feedback_user_id
                    ON analysis_feedback(user_id);
                CREATE INDEX IF NOT EXISTS IX_analysis_feedback_guest_session_id
                    ON analysis_feedback(guest_session_id);

                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260429225652_InitialSchema', '9.0.0');
            END IF;
        END $$;
        """);
}

static async Task EnsureRuntimeSchemaAsync(AppDbContext dbContext)
{
    await dbContext.Database.ExecuteSqlRawAsync("""
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS preferred_color_theme character varying(24) NOT NULL DEFAULT 'kirmizi',
            ADD COLUMN IF NOT EXISTS recommendation_goal character varying(32),
            ADD COLUMN IF NOT EXISTS energy_preference character varying(32),
            ADD COLUMN IF NOT EXISTS favorite_music_genres text,
            ADD COLUMN IF NOT EXISTS favorite_movie_genres text,
            ADD COLUMN IF NOT EXISTS favorite_book_genres text,
            ADD COLUMN IF NOT EXISTS spotify_access_token text,
            ADD COLUMN IF NOT EXISTS spotify_refresh_token text,
            ADD COLUMN IF NOT EXISTS spotify_token_expiry timestamp with time zone;

        DO $$
        BEGIN
            IF to_regclass('analysis_records') IS NOT NULL THEN
                ALTER TABLE analysis_records
                    ADD COLUMN IF NOT EXISTS status character varying(16) NOT NULL DEFAULT 'complete';
            END IF;

            IF to_regclass('user_personality_profiles') IS NOT NULL THEN
                ALTER TABLE user_personality_profiles
                    ADD COLUMN IF NOT EXISTS avatar_url text,
                    ADD COLUMN IF NOT EXISTS avatar_generated_at timestamp with time zone;
            END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS user_media_log (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type character varying(16) NOT NULL,
            title character varying(240) NOT NULL,
            note character varying(1000),
            logged_at timestamp with time zone NOT NULL DEFAULT NOW()
        );
        """);
}
