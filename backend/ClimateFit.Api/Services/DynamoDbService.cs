using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using ClimateFit.Api.Models;
using System.Text.Json;

namespace ClimateFit.Api.Services;

public class DynamoDbService
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _usersTableName;
    private readonly string _submissionsTableName;

    public DynamoDbService(IAmazonDynamoDB dynamoDb, IConfiguration config)
    {
        _dynamoDb = dynamoDb;
        _usersTableName = config["DynamoDB:UsersTable"] ?? "ClimateFit-Users";
        _submissionsTableName = config["DynamoDB:SubmissionsTable"] ?? "ClimateFit-Submissions";
    }

    public async Task EnsureTablesExistAsync()
    {
        await EnsureUserTableExistsAsync();
        await EnsureSubmissionTableExistsAsync();
    }

    private async Task EnsureUserTableExistsAsync()
    {
        try
        {
            await _dynamoDb.DescribeTableAsync(_usersTableName);
        }
        catch (ResourceNotFoundException)
        {
            var createRequest = new CreateTableRequest
            {
                TableName = _usersTableName,
                KeySchema = new List<KeySchemaElement>
                {
                    new KeySchemaElement("Email", KeyType.HASH)
                },
                AttributeDefinitions = new List<AttributeDefinition>
                {
                    new AttributeDefinition("Email", ScalarAttributeType.S)
                },
                BillingMode = BillingMode.PAY_PER_REQUEST
            };

            await _dynamoDb.CreateTableAsync(createRequest);
        }
    }

    private async Task EnsureSubmissionTableExistsAsync()
    {
        try
        {
            await _dynamoDb.DescribeTableAsync(_submissionsTableName);
        }
        catch (ResourceNotFoundException)
        {
            var createRequest = new CreateTableRequest
            {
                TableName = _submissionsTableName,
                KeySchema = new List<KeySchemaElement>
                {
                    new KeySchemaElement("Id", KeyType.HASH)
                },
                AttributeDefinitions = new List<AttributeDefinition>
                {
                    new AttributeDefinition("Id", ScalarAttributeType.S)
                },
                BillingMode = BillingMode.PAY_PER_REQUEST
            };

            await _dynamoDb.CreateTableAsync(createRequest);
        }
    }

    // User operations
    public async Task<UserEntity?> GetUserAsync(string email)
    {
        try
        {
            var response = await _dynamoDb.GetItemAsync(_usersTableName, new Dictionary<string, AttributeValue>
            {
                ["Email"] = new AttributeValue { S = email }
            });

            if (!response.IsItemSet) return null;

            return new UserEntity
            {
                Email = response.Item["Email"].S,
                Username = response.Item.ContainsKey("Username") ? response.Item["Username"].S : "",
                PasswordHash = response.Item.ContainsKey("PasswordHash") ? response.Item["PasswordHash"].S : "",
                Preferences = response.Item.ContainsKey("Preferences") && !string.IsNullOrEmpty(response.Item["Preferences"].S) 
                    ? JsonSerializer.Deserialize<object>(response.Item["Preferences"].S) 
                    : null,
                History = response.Item.ContainsKey("History") && !string.IsNullOrEmpty(response.Item["History"].S)
                    ? JsonSerializer.Deserialize<List<HistoryItem>>(response.Item["History"].S) ?? new List<HistoryItem>()
                    : new List<HistoryItem>(),
                CreatedAt = response.Item.ContainsKey("CreatedAt") ? DateTime.Parse(response.Item["CreatedAt"].S) : DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            throw new Exception($"Error getting user: {ex.Message}", ex);
        }
    }

    public async Task CreateUserAsync(UserEntity user)
    {
        try
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["Email"] = new AttributeValue { S = user.Email },
                ["Username"] = new AttributeValue { S = user.Username },
                ["PasswordHash"] = new AttributeValue { S = user.PasswordHash },
                ["CreatedAt"] = new AttributeValue { S = DateTime.UtcNow.ToString("O") },
                ["History"] = new AttributeValue { S = JsonSerializer.Serialize(user.History) }
            };

            if (user.Preferences != null)
            {
                item["Preferences"] = new AttributeValue { S = JsonSerializer.Serialize(user.Preferences) };
            }

            await _dynamoDb.PutItemAsync(_usersTableName, item);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error creating user: {ex.Message}", ex);
        }
    }

    public async Task UpdateUserAsync(UserEntity user)
    {
        try
        {
            var updateRequest = new UpdateItemRequest
            {
                TableName = _usersTableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    ["Email"] = new AttributeValue { S = user.Email }
                },
                UpdateExpression = "SET Username = :username, PasswordHash = :passwordHash, Preferences = :preferences, History = :history",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":username"] = new AttributeValue { S = user.Username },
                    [":passwordHash"] = new AttributeValue { S = user.PasswordHash },
                    [":preferences"] = new AttributeValue { S = user.Preferences != null ? JsonSerializer.Serialize(user.Preferences) : "" },
                    [":history"] = new AttributeValue { S = JsonSerializer.Serialize(user.History) }
                }
            };

            await _dynamoDb.UpdateItemAsync(updateRequest);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error updating user: {ex.Message}", ex);
        }
    }

    // Submission operations
    public async Task CreateSubmissionAsync(SubmissionEntity submission)
    {
        try
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["Id"] = new AttributeValue { S = submission.Id },
                ["Email"] = new AttributeValue { S = submission.Email },
                ["Time"] = new AttributeValue { S = submission.Time.ToString("O") },
                ["Onboarding"] = new AttributeValue { S = submission.Onboarding != null ? JsonSerializer.Serialize(submission.Onboarding) : "" },
                ["Cities"] = new AttributeValue { S = JsonSerializer.Serialize(submission.Cities) }
            };

            await _dynamoDb.PutItemAsync(_submissionsTableName, item);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error creating submission: {ex.Message}", ex);
        }
    }
}

// DynamoDB-specific entities
public class UserEntity
{
    public string Email { get; set; } = "";
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public object? Preferences { get; set; }
    public List<HistoryItem> History { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class SubmissionEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTimeOffset Time { get; set; }
    public string Email { get; set; } = "anonymous@local";
    public object? Onboarding { get; set; }
    public string[] Cities { get; set; } = Array.Empty<string>();
}
