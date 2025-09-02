using ClimateFit.Api.Models;
using ClimateFit.Api.Services;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using Amazon.DynamoDBv2;
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

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Secret"];
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30) // Allow a small clock skew
        };
        
        // Add debugging
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Auth Failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("JWT Token validated successfully");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSingleton<JwtService>();

// Configure AWS DynamoDB
var region = builder.Configuration["DynamoDB:Region"] ?? "us-east-1";
builder.Services.AddSingleton<IAmazonDynamoDB>(sp => 
{
    var config = new AmazonDynamoDBConfig { RegionEndpoint = RegionEndpoint.GetBySystemName(region) };
    return new AmazonDynamoDBClient(config);
});
builder.Services.AddSingleton<DynamoDbService>();

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

        var token = jwt.Create(req.Email, TimeSpan.FromMinutes(5));
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
    {   Console.WriteLine("=== Profile endpoint called ===");
        Console.WriteLine($"User.Identity.IsAuthenticated: {ctx.User.Identity.IsAuthenticated}");
        Console.WriteLine("All claims:");
        foreach (var claim in ctx.User.Claims)
        {
            Console.WriteLine($"  {claim.Type} = {claim.Value}");
        }
        
        var email = ctx.User.FindFirst(ClaimTypes.Email)?.Value;
        Console.WriteLine($"Extracted email: '{email}'");
        
        if (string.IsNullOrEmpty(email))
        {
            Console.WriteLine("❌ Email is null/empty - returning Unauthorized");
            return Results.Unauthorized();
        }
        
        var user = await dynamoDb.GetUserAsync(email);
        if (user == null)
        {
            return Results.NotFound(new { error = "User not found" });
        }

        return Results.Ok(new ProfileDto(user.Email, user.Username, user.Preferences, user.History));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
}).RequireAuthorization();

app.MapPut("/profile/preferences", async (HttpContext ctx, DynamoDbService dynamoDb) =>
{
    try
    {
        var email = ctx.User.FindFirst("email")?.Value;
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

app.MapPost("/results", async (OnboardingRequest req, HttpContext ctx, DynamoDbService dynamoDb) =>
{
    try
    {
        // Extract email from JWT token (optional for anonymous users)
        string email = "anonymous@local";
        var userEmail = ctx.User.FindFirst("email")?.Value;
        if (!string.IsNullOrEmpty(userEmail))
        {
            email = userEmail;
        }

        // Simple rule-based demo suggestions based on user preferences
        var list = new List<City>();
        
        // Base recommendations on temperature preferences
        if (req.avgTemp.HasValue && req.avgTemp.Value > 25)
        {
            list.Add(new City("Auckland", "Warm maritime climate."));
            list.Add(new City("Wellington", "Moderate temperatures."));
        }
        else if (req.avgTemp.HasValue && req.avgTemp.Value < 15)
        {
            list.Add(new City("Christchurch", "Cooler climate."));
            list.Add(new City("Dunedin", "Southern cooler climate."));
        }
        else
        {
            list.Add(new City("Auckland", "Balanced climate."));
            list.Add(new City("Wellington", "Temperate climate."));
        }
        
        // Add favorite cities if provided
        if (req.favoriteCities != null && req.favoriteCities.Length > 0)
        {
            foreach (var city in req.favoriteCities.Take(2))
            {
                if (!list.Any(c => c.Name.Equals(city, StringComparison.OrdinalIgnoreCase)))
                {
                    list.Add(new City(city, "Your preferred city."));
                }
            }
        }
        
        // Ensure we have at least 3 recommendations
        while (list.Count < 3) 
        {
            if (!list.Any(c => c.Name == "Hamilton"))
                list.Add(new City("Hamilton", "Inland temperate."));
            else if (!list.Any(c => c.Name == "Tauranga"))
                list.Add(new City("Tauranga", "Coastal warm."));
            else
                list.Add(new City("Napier", "Sunny Hawke's Bay."));
        }

        // Save submission
        var submission = new SubmissionEntity
        {
            Time = DateTimeOffset.UtcNow,
            Email = email,
            Onboarding = req,
            Cities = list.Select(c => c.Name).ToArray()
        };
        await dynamoDb.CreateSubmissionAsync(submission);

        // Update user preferences and history if logged in
        if (email != "anonymous@local")
        {
            var user = await dynamoDb.GetUserAsync(email);
            if (user != null)
            {
                if (req.save == true)
                {
                    user.Preferences = req;
                }
                
                // Only add to history if it's a new submission (check if last entry is different)
                var newHistoryItem = new HistoryItem(list.Select(c => c.Name).ToArray(), DateTimeOffset.UtcNow.ToString("yyyy-MM-dd"));
                if (user.History.Count == 0 || 
                    !user.History.Last().Cities.SequenceEqual(newHistoryItem.Cities) ||
                    user.History.Last().Date != newHistoryItem.Date)
                {
                    user.History.Add(newHistoryItem);
                    
                    // Keep only the last 3 history items
                    if (user.History.Count > 3)
                    {
                        user.History = user.History.Skip(user.History.Count - 3).ToList();
                    }
                }
                
                await dynamoDb.UpdateUserAsync(user);
            }
        }

        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Debugging: print all claims for the authenticated user
app.MapGet("/debug/claims", async (HttpContext ctx) =>
{
    foreach (var claim in ctx.User.Claims)
        Console.WriteLine($"Claim: {claim.Type} = {claim.Value}");

    return Results.Ok();
}).RequireAuthorization();

app.Run();