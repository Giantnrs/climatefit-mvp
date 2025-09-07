using Amazon.S3;
using Amazon.S3.Model;
using System.Text.Json;
using ClimateFit.Api.Models;

namespace ClimateFit.Api.Services;

public class ClimateDataService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName = "climate-data-bucket-527";
    private readonly string _dataKey = "climate-data/climate_famous300_cities_monthly_20250907_171040.json";
    private List<ClimateRecord>? _cachedData;
    private readonly SemaphoreSlim _cacheSemaphore = new(1, 1);

    public ClimateDataService(IAmazonS3 s3Client)
    {
        _s3Client = s3Client;
    }

    public async Task<List<ClimateRecord>> GetClimateDataAsync()
    {
        if (_cachedData != null)
            return _cachedData;

        await _cacheSemaphore.WaitAsync();
        try
        {
            if (_cachedData != null)
                return _cachedData;

            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = _dataKey
            };

            using var response = await _s3Client.GetObjectAsync(request);
            using var reader = new StreamReader(response.ResponseStream, System.Text.Encoding.UTF8);
            var jsonContent = await reader.ReadToEndAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            _cachedData = JsonSerializer.Deserialize<List<ClimateRecord>>(jsonContent, options) ?? new List<ClimateRecord>();
            return _cachedData;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading climate data from S3: {ex.Message}");
            // Return empty list if S3 fails
            return new List<ClimateRecord>();
        }
        finally
        {
            _cacheSemaphore.Release();
        }
    }

    public async Task<List<CityClimateData>> GetCitiesForMonthAsync(string monthKey)
    {
        var allData = await GetClimateDataAsync();
        
        // Parse month key (format: "2024-01" or "2024-Jan")
        var parts = monthKey.Split('-');
        if (parts.Length != 2) return new List<CityClimateData>();
        
        var year = int.Parse(parts[0]);
        var month = int.Parse(parts[1]);
        
        // Group by city name only to handle cities with multiple coordinate records
        // This ensures we get one record per unique city name
        var citiesData = allData
            .Where(record => record.Year == year && record.Month == month)
            .GroupBy(record => record.CityName)
            .Select(group => new CityClimateData
            {
                CityName = group.Key,
                CountryCode = group.First().CountryCode,
                Latitude = group.First().AvgLat,
                Longitude = group.First().AvgLon,
                Quarter = monthKey,
                Temperature = group.First().Tavg,
                Precipitation = group.First().Prcp,
                MaxTemp = group.First().Tmax,
                MinTemp = group.First().Tmin
            })
            .Where(city => city.Temperature.HasValue && city.Precipitation.HasValue)
            .ToList();

        return citiesData;
    }

    public async Task<List<CityClimateData>> GetCitiesForQuarterAsync(string quarter)
    {
        var allData = await GetClimateDataAsync();
        
        // Group by city and get the data for the specific quarter
        var citiesData = allData
            .Where(record => record.Quarter == quarter)
            .GroupBy(record => new { record.CityName, record.CountryCode, record.AvgLat, record.AvgLon })
            .Select(group => new CityClimateData
            {
                CityName = group.Key.CityName,
                CountryCode = group.Key.CountryCode,
                Latitude = group.Key.AvgLat,
                Longitude = group.Key.AvgLon,
                Quarter = quarter,
                Temperature = group.First().Tavg,
                Precipitation = group.First().Prcp,
                MaxTemp = group.First().Tmax,
                MinTemp = group.First().Tmin
            })
            .Where(city => city.Temperature.HasValue && city.Precipitation.HasValue)
            .ToList();

        return citiesData;
    }

    public async Task<List<string>> GetAvailableMonthsAsync()
    {
        var allData = await GetClimateDataAsync();
        return allData
            .Select(record => $"{record.Year}-{record.Month:D2}")
            .Distinct()
            .OrderBy(m => m)
            .ToList();
    }

    public async Task<List<string>> GetAvailableQuartersAsync()
    {
        var allData = await GetClimateDataAsync();
        return allData
            .Select(record => record.Quarter)
            .Distinct()
            .OrderBy(q => q)
            .ToList();
    }
}
