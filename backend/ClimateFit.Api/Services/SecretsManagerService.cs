using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Text.Json;

namespace ClimateFit.Api.Services;

public class SecretsManagerService
{
    private readonly IAmazonSecretsManager _secretsManager;
    private readonly ILogger<SecretsManagerService> _logger;

    public SecretsManagerService(IAmazonSecretsManager secretsManager, ILogger<SecretsManagerService> logger)
    {
        _secretsManager = secretsManager;
        _logger = logger;
    }

    public async Task<string?> GetSecretAsync(string secretName)
    {
        try
        {
            var request = new GetSecretValueRequest
            {
                SecretId = secretName
            };

            var response = await _secretsManager.GetSecretValueAsync(request);
            return response.SecretString;
        }
        catch (ResourceNotFoundException)
        {
            _logger.LogWarning("Secret '{SecretName}' not found in AWS Secrets Manager", secretName);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve secret '{SecretName}' from AWS Secrets Manager", secretName);
            return null;
        }
    }

    public async Task<T?> GetSecretObjectAsync<T>(string secretName) where T : class
    {
        try
        {
            var secretValue = await GetSecretAsync(secretName);
            if (string.IsNullOrEmpty(secretValue))
                return null;

            return JsonSerializer.Deserialize<T>(secretValue, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deserialize secret '{SecretName}' as {Type}", secretName, typeof(T).Name);
            return null;
        }
    }
}