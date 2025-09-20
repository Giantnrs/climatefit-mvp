using ClimateFit.Api.Models;
using ClimateFit.Api.Services;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.S3;
using Amazon.SecretsManager;
using Amazon;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);
var front = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN") ?? "http://localhost:3000";
builder.Services.AddCors(opt=> opt.AddPolicy("frontend", p=> p.WithOrigins(front).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c=> c.SwaggerDoc("v1", new OpenApiInfo{ Title="ClimateFit API", Version="v1" }));

// Register AWS Services
var region = builder.Configuration["DynamoDB:Region"] ?? "us-east-1";
builder.Services.AddSingleton<IAmazonSecretsManager>(sp =>
{
    var config = new AmazonSecretsManagerConfig { RegionEndpoint = RegionEndpoint.GetBySystemName(region) };
    return new AmazonSecretsManagerClient(config);
});

// Register custom services
builder.Services.AddSingleton<SecretsManagerService>();
builder.Services.AddSingleton<CityRecommendationService>();

// Configure JWT Authentication to support both custom JWT and AWS Cognito
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        // Get Cognito configuration
        var cognitoUserPoolId = builder.Configuration["Cognito:UserPoolId"];
        var cognitoRegion = builder.Configuration["Cognito:Region"] ?? region;
        
        if (!string.IsNullOrEmpty(cognitoUserPoolId))
        {
            // Configure for AWS Cognito JWT validation
            var cognitoIssuer = $"https://cognito-idp.{cognitoRegion}.amazonaws.com/{cognitoUserPoolId}";
            var cognitoJwksUri = $"{cognitoIssuer}/.well-known/jwks.json";
            
            Console.WriteLine($"✅ Configuring JWT authentication for AWS Cognito:");
            Console.WriteLine($"   Issuer: {cognitoIssuer}");
            Console.WriteLine($"   JWKS URI: {cognitoJwksUri}");
            
            options.Authority = cognitoIssuer;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = cognitoIssuer,
                ValidateAudience = false, // Cognito tokens may not have audience
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ClockSkew = TimeSpan.FromMinutes(5) // Allow some clock skew
            };
        }
        else
        {
            // Fallback to custom JWT for development/backwards compatibility
            Console.WriteLine("⚠️  No Cognito configuration found, using custom JWT validation");
            
            var jwtKey = GetJwtSecretAsync(builder).GetAwaiter().GetResult();
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.FromSeconds(30)
            };
        }
        
        // Add debugging for both authentication types
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"❌ JWT Auth Failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("✅ JWT Token validated successfully");
                
                // Log all claims for debugging
                Console.WriteLine("Token Claims:");
                foreach (var claim in context.Principal.Claims)
                {
                    Console.WriteLine($"  {claim.Type} = {claim.Value}");
                }
                
                // Ensure we have an email claim for our application logic
                var email = context.Principal.FindFirst("email")?.Value ?? 
                           context.Principal.FindFirst(ClaimTypes.Email)?.Value ??
                           context.Principal.FindFirst("cognito:username")?.Value ??
                           context.Principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                
                if (!string.IsNullOrEmpty(email))
                {
                    // Add standardized email claim if it doesn't exist
                    if (!context.Principal.HasClaim(ClaimTypes.Email, email))
                    {
                        var identity = context.Principal.Identity as ClaimsIdentity;
                        identity?.AddClaim(new Claim(ClaimTypes.Email, email));
                    }
                    Console.WriteLine($"✅ Email claim standardized: {email}");
                }
                else
                {
                    Console.WriteLine("⚠️  No email claim found in token");
                }
                
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                var token = context.Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();
                if (!string.IsNullOrEmpty(token))
                {
                    Console.WriteLine($"📥 Received JWT token: {token.Substring(0, Math.Min(50, token.Length))}...");
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Keep JwtService for backward compatibility and custom token generation if needed
builder.Services.AddSingleton<JwtService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var secretsManager = sp.GetService<SecretsManagerService>();
    var logger = sp.GetService<ILogger<JwtService>>();
    return new JwtService(config, secretsManager, logger);
});

// Configure AWS DynamoDB and S3
builder.Services.AddSingleton<IAmazonDynamoDB>(sp =>
{
    var config = new AmazonDynamoDBConfig { RegionEndpoint = RegionEndpoint.GetBySystemName(region) };
    return new AmazonDynamoDBClient(config);
});
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var config = new AmazonS3Config { RegionEndpoint = RegionEndpoint.GetBySystemName(region) };
    return new AmazonS3Client(config);
});
builder.Services.AddSingleton<DynamoDbService>();
builder.Services.AddSingleton<ClimateDataService>(sp =>
{
    var s3Client = sp.GetRequiredService<IAmazonS3>();
    var config = sp.GetRequiredService<IConfiguration>();
    return new ClimateDataService(s3Client, config);
});

// Keep FileDb as fallback for development
builder.Services.AddSingleton<FileDb<DbSchema>>(sp => {
  var env = sp.GetRequiredService<IWebHostEnvironment>();
  return new FileDb<DbSchema>(env, builder.Configuration["Storage:JsonPath"] ?? "App_Data/db.json");
});

var app = builder.Build();

// Initialize DynamoDB tables (only if AWS credentials are configured)
try
{
    var dynamoService = app.Services.GetRequiredService<DynamoDbService>();
    await dynamoService.EnsureTablesExistAsync();
    Console.WriteLine("✅ DynamoDB tables initialized successfully");
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️  DynamoDB initialization failed: {ex.Message}");
    Console.WriteLine("💡 Will fall back to local file storage. Configure AWS credentials to use DynamoDB.");
}

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
if(app.Environment.IsDevelopment()){ app.UseSwagger(); app.UseSwaggerUI(); }

app.MapGet("/health", ()=> Results.Ok( new { ok=true, time=DateTimeOffset.UtcNow }));

// Keep existing auth endpoints for backward compatibility
app.MapPost("/auth/register", async (RegisterRequest req, DynamoDbService dynamoDb) =>
{
    try
    {
        // Check if user already exists
        var existingUser = await dynamoDb.GetUserAsync(req.Email);
        if (existingUser != null)
        {
            return Results.BadRequest(new { error = "User already exists" });
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

        // Create new user
        var user = new UserEntity
        {
            Email = req.Email,
            Username = req.Username,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };

        await dynamoDb.CreateUserAsync(user);
        return Results.Ok(new { message = "User registered successfully" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/auth/login", async (LoginRequest req, DynamoDbService dynamoDb, JwtService jwt) =>
{
    try
    {
        var user = await dynamoDb.GetUserAsync(req.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            return Results.Unauthorized();
        }

        var token = jwt.Create(req.Email, TimeSpan.FromMinutes(30));
        return Results.Ok(new LoginResponse(token));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/auth/forgot", async (ForgotRequest req, DynamoDbService dynamoDb) =>
{
    try
    {
        var user = await dynamoDb.GetUserAsync(req.Email);
        if (user == null)
        {
            return Results.BadRequest(new { error = "User not found" });
        }

        // In a real implementation, you would verify the code here
        // For now, we'll just update the password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.PasswordHash = passwordHash;

        await dynamoDb.UpdateUserAsync(user);
        return Results.Ok(new { message = "Password reset successfully" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapGet("/profile", async (HttpContext ctx, DynamoDbService dynamoDb) =>
{
    try
    {   
        Console.WriteLine("=== Profile endpoint called ===");
        Console.WriteLine($"User.Identity.IsAuthenticated: {ctx.User.Identity.IsAuthenticated}");
        Console.WriteLine("All claims:");
        foreach (var claim in ctx.User.Claims)
        {
            Console.WriteLine($"  {claim.Type} = {claim.Value}");
        }
        
        // Extract email from various possible claim types (supports both custom JWT and Cognito)
        var email = ctx.User.FindFirst(ClaimTypes.Email)?.Value ?? 
                   ctx.User.FindFirst("email")?.Value ??
                   ctx.User.FindFirst("cognito:username")?.Value ??
                   ctx.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        
        Console.WriteLine($"Extracted email: '{email}'");
        
        if (string.IsNullOrEmpty(email))
        {
            Console.WriteLine("❌ Email is null/empty - returning Unauthorized");
            return Results.Unauthorized();
        }
        
        var user = await dynamoDb.GetUserAsync(email);
        if (user == null)
        {
            // For Cognito users who don't exist in our database yet, create a minimal user record
            Console.WriteLine($"User not found in database, creating new record for Cognito user: {email}");
            
            var newUser = new UserEntity
            {
                Email = email,
                Username = ctx.User.FindFirst("cognito:username")?.Value ?? 
                         ctx.User.FindFirst("given_name")?.Value ?? 
                         ctx.User.FindFirst("name")?.Value ?? 
                         email.Split('@')[0],
                PasswordHash = "", // No password for Cognito users
                CreatedAt = DateTime.UtcNow,
                History = new List<HistoryItem>()
            };
            
            await dynamoDb.CreateUserAsync(newUser);
            return Results.Ok(new ProfileDto(newUser.Email, newUser.Username, newUser.Preferences, newUser.History));
        }

        return Results.Ok(new ProfileDto(user.Email, user.Username, user.Preferences, user.History));
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Profile endpoint error: {ex.Message}");
        return Results.BadRequest(new { error = ex.Message });
    }
}).RequireAuthorization();

app.MapPut("/profile/preferences", async (HttpContext ctx, DynamoDbService dynamoDb) =>
{
    try
    {
        var email = ctx.User.FindFirst(ClaimTypes.Email)?.Value ?? 
                   ctx.User.FindFirst("email")?.Value ??
                   ctx.User.FindFirst("cognito:username")?.Value ??
                   ctx.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        
        if (string.IsNullOrEmpty(email))
        {
            return Results.Unauthorized();
        }

        using var sr = new StreamReader(ctx.Request.Body);
        var json = await sr.ReadToEndAsync();
        var doc = JsonSerializer.Deserialize<object>(json);

        var user = await dynamoDb.GetUserAsync(email);
        if (user == null)
        {
            return Results.NotFound(new { error = "User not found" });
        }

        user.Preferences = doc;
        await dynamoDb.UpdateUserAsync(user);

        return Results.Ok(new { message = "Preferences updated successfully" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
}).RequireAuthorization();

app.MapPost("/results", async (OnboardingRequest req, HttpContext ctx, DynamoDbService dynamoDb, CityRecommendationService recommendationService) =>
{
    try
    {
        // Extract email from JWT token (supports both custom JWT and Cognito, optional for anonymous users)
        string email = "anonymous@local";
        var userEmail = ctx.User.FindFirst(ClaimTypes.Email)?.Value ?? 
                       ctx.User.FindFirst("email")?.Value ??
                       ctx.User.FindFirst("cognito:username")?.Value ??
                       ctx.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        
        if (!string.IsNullOrEmpty(userEmail))
        {
            email = userEmail;
        }

        // Get city recommendations using the new service
        var recommendations = await recommendationService.GetRecommendationsAsync(req);
        var list = recommendations.Select(r => new City(r.CityName + ", " + r.Country, r.Summary)).ToList();

        // Save submission
        var submission = new SubmissionEntity
        {
            Time = DateTimeOffset.UtcNow,
            Email = email,
            Onboarding = req,
            Cities = recommendations.Select(r => r.CityName + ", " + r.Country).ToArray()
        };
        await dynamoDb.CreateSubmissionAsync(submission);

        // Update user preferences and history if logged in
        if (email != "anonymous@local")
        {
            Console.WriteLine($"Updating user data for logged in user: {email}");
            var user = await dynamoDb.GetUserAsync(email);
            
            if (user == null)
            {
                // Create user record for new Cognito users
                Console.WriteLine($"Creating new user record for Cognito user: {email}");
                user = new UserEntity
                {
                    Email = email,
                    Username = ctx.User.FindFirst("cognito:username")?.Value ?? 
                             ctx.User.FindFirst("given_name")?.Value ?? 
                             ctx.User.FindFirst("name")?.Value ?? 
                             email.Split('@')[0],
                    PasswordHash = "", // No password for Cognito users
                    CreatedAt = DateTime.UtcNow,
                    History = new List<HistoryItem>()
                };
                await dynamoDb.CreateUserAsync(user);
            }
            
            if (user != null)
            {
                Console.WriteLine($"User found/created. Current preferences: {user.Preferences != null}");
                Console.WriteLine($"Save flag: {req.save}");
                
                if (req.save == true)
                {
                    Console.WriteLine("Saving preferences to user profile");
                    user.Preferences = req;
                }
                
                // Always add to history for logged in users
                var newHistoryItem = new HistoryItem(recommendations.Select(r => r.CityName + ", " + r.Country).ToArray(), DateTimeOffset.UtcNow.ToString("yyyy-MM-dd HH:mm"));
                Console.WriteLine($"Adding history item: {string.Join(", ", newHistoryItem.Cities)} on {newHistoryItem.Date}");
                
                // Only add if it's a genuinely new submission (different from the last one)
                var shouldAddHistory = user.History.Count == 0 || 
                    !user.History.Last().Cities.SequenceEqual(newHistoryItem.Cities) ||
                    user.History.Last().Date != newHistoryItem.Date;
                
                if (shouldAddHistory)
                {
                    user.History.Add(newHistoryItem);
                    Console.WriteLine($"History item added. Total history count: {user.History.Count}");
                    
                    // Keep only the last 3 history items
                    if (user.History.Count > 3)
                    {
                        user.History = user.History.Skip(user.History.Count - 3).ToList();
                        Console.WriteLine("Trimmed history to last 3 items");
                    }
                }
                else
                {
                    Console.WriteLine("Skipping duplicate history entry");
                }
                
                await dynamoDb.UpdateUserAsync(user);
                Console.WriteLine("User data updated successfully");
            }
        }
        else
        {
            Console.WriteLine("Anonymous user - skipping profile update");
        }

        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Keep all existing endpoints unchanged
app.MapGet("/api/cities", async (DynamoDbService dynamoDb) =>
{
    try
    {
        var cities = await dynamoDb.GetAllCityClimatesAsync();
        var cityNames = cities.Select(c => c.CityName).Distinct().OrderBy(name => name).ToList();
        return Results.Ok(cityNames);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting cities: {ex.Message}");
        return Results.Problem("Failed to load city list");
    }
});

app.MapGet("/api/climate/months", async (ClimateDataService climateService) =>
{
    try
    {
        var months = await climateService.GetAvailableMonthsAsync();
        return Results.Ok(months);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting months: {ex.Message}");
        return Results.Problem("Failed to load climate months");
    }
});

app.MapGet("/api/climate/month/{monthKey}", async (string monthKey, ClimateDataService climateService) =>
{
    try
    {
        var cities = await climateService.GetCitiesForMonthAsync(monthKey);
        return Results.Ok(cities);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting climate data for month {monthKey}: {ex.Message}");
        return Results.Problem("Failed to load climate data for the specified month");
    }
});

app.MapGet("/api/climate/quarters", async (ClimateDataService climateService) =>
{
    try
    {
        var quarters = await climateService.GetAvailableQuartersAsync();
        return Results.Ok(quarters);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting quarters: {ex.Message}");
        return Results.Problem("Failed to load climate quarters");
    }
});

app.MapGet("/api/climate/{quarter}", async (string quarter, ClimateDataService climateService) =>
{
    try
    {
        var cities = await climateService.GetCitiesForQuarterAsync(quarter);
        return Results.Ok(cities);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting climate data for quarter {quarter}: {ex.Message}");
        return Results.Problem("Failed to load climate data for the specified quarter");
    }
});

// Debugging: print all claims for the authenticated user
app.MapGet("/debug/claims", async (HttpContext ctx) =>
{
    foreach (var claim in ctx.User.Claims)
        Console.WriteLine($"Claim: {claim.Type} = {claim.Value}");

    return Results.Ok(ctx.User.Claims.Select(c => new { type = c.Type, value = c.Value }).ToList());
}).RequireAuthorization();

app.Run();

// Helper function to get JWT secret from AWS Secrets Manager with fallback (for backward compatibility)
static async Task<string> GetJwtSecretAsync(WebApplicationBuilder builder)
{
    // 1. Try environment variable first
    var envSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
    if (!string.IsNullOrEmpty(envSecret))
    {
        Console.WriteLine("✅ Using JWT secret from environment variable");
        return envSecret;
    }

    // 2. Try AWS Secrets Manager
    try
    {
        var region = builder.Configuration["DynamoDB:Region"] ?? "us-east-1";
        var secretName = builder.Configuration["Jwt:SecretName"] ?? "climatefit/dev/jwt";

        var config = new AmazonSecretsManagerConfig { RegionEndpoint = RegionEndpoint.GetBySystemName(region) };
        using var secretsClient = new AmazonSecretsManagerClient(config);

        Console.WriteLine($"🔍 Attempting to retrieve JWT secret from AWS Secrets Manager: {secretName}");

        var request = new Amazon.SecretsManager.Model.GetSecretValueRequest
        {
            SecretId = secretName
        };

        var response = await secretsClient.GetSecretValueAsync(request);
        if (!string.IsNullOrEmpty(response.SecretString))
        {
            Console.WriteLine("✅ Successfully retrieved JWT secret from AWS Secrets Manager");
            return response.SecretString;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  Failed to retrieve JWT secret from AWS Secrets Manager: {ex.Message}");
    }

    // 3. Try configuration file
    var configSecret = builder.Configuration["Jwt:Secret"];
    if (!string.IsNullOrEmpty(configSecret))
    {
        Console.WriteLine("✅ Using JWT secret from configuration file");
        return configSecret;
    }

    // 4. Fallback to default (only for development)
    Console.WriteLine("⚠️  Using default JWT secret - this should only happen in development!");
    return "CHANGE_ME_DEV_JWT_SECRET";
}