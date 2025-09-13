using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ClimateFit.Api.Services;

public class JwtService
{
    private readonly string _issuer;
    private readonly string _aud;
    private readonly string _secret;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IConfiguration cfg, SecretsManagerService? secretsManager = null, ILogger<JwtService>? logger = null)
    {
        _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<JwtService>.Instance;
        _issuer = cfg["Jwt:Issuer"] ?? "ClimateFit";
        _aud = cfg["Jwt:Audience"] ?? "ClimateFitUsers";

        // Initialize secret with fallback chain
        _secret = GetJwtSecret(cfg, secretsManager).GetAwaiter().GetResult();
    }

    private async Task<string> GetJwtSecret(IConfiguration cfg, SecretsManagerService? secretsManager)
    {
        // 1. Try environment variable first
        var envSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (!string.IsNullOrEmpty(envSecret))
        {
            _logger.LogInformation("Using JWT secret from environment variable");
            return envSecret;
        }

        // 2. Try AWS Secrets Manager
        if (secretsManager != null)
        {
            try
            {
                var secretName = cfg["Jwt:SecretName"] ?? "climatefit/jwt-secret";
                _logger.LogInformation("Attempting to retrieve JWT secret from AWS Secrets Manager: {SecretName}", secretName);

                var awsSecret = await secretsManager.GetSecretAsync(secretName);
                if (!string.IsNullOrEmpty(awsSecret))
                {
                    _logger.LogInformation("Successfully retrieved JWT secret from AWS Secrets Manager");
                    return awsSecret;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve JWT secret from AWS Secrets Manager, falling back to config");
            }
        }

        // 3. Try configuration file
        var configSecret = cfg["Jwt:Secret"];
        if (!string.IsNullOrEmpty(configSecret))
        {
            _logger.LogInformation("Using JWT secret from configuration file");
            return configSecret;
        }

        // 4. Fallback to default (only for development)
        _logger.LogWarning("Using default JWT secret - this should only happen in development!");
        return "CHANGE_ME_DEV_JWT_SECRET";
    }

    public string Create(string email, TimeSpan? life = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var now = DateTime.UtcNow;
        var exp = now.Add(life ?? TimeSpan.FromDays(7));
        var token = new JwtSecurityToken(_issuer, _aud, new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, email),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("email", email),
            new Claim(ClaimTypes.Email, email) // Add this for middleware compatibility
        }, now, exp, creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}