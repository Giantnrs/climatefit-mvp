using System.Globalization;
using ClimateFit.Api.Models;

namespace ClimateFit.Api.Services;

public class CityRecommendationService
{
    private readonly DynamoDbService _dynamoDbService;
    private List<CityClimate>? _citiesCache;

    public CityRecommendationService(DynamoDbService dynamoDbService)
    {
        _dynamoDbService = dynamoDbService;
    }

    private async Task<List<CityClimate>> LoadCityDataAsync()
    {
        if (_citiesCache != null)
        {
            return _citiesCache;
        }

        try
        {
            _citiesCache = await _dynamoDbService.GetAllCityClimatesAsync();
            return _citiesCache;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading city data from DynamoDB: {ex.Message}");
            return new List<CityClimate>();
        }
    }



    public async Task<List<CityRecommendation>> GetRecommendationsAsync(OnboardingRequest preferences)
    {
        var cities = await LoadCityDataAsync();
        var recommendations = new List<CityRecommendation>();

        foreach (var city in cities)
        {
            var score = CalculateScore(city, preferences);
            var summary = GenerateSummary(city, preferences);
            
            recommendations.Add(new CityRecommendation
            {
                CityName = city.CityName,
                Country = city.Country,
                Score = score,
                Summary = summary,
                ClimateData = city
            });
        }

        // Return top 3 cities
        return recommendations
            .OrderByDescending(r => r.Score)
            .Take(3)
            .ToList();
    }

    private double CalculateScore(CityClimate city, OnboardingRequest preferences)
    {
        double score = 0;
        double maxScore = 0;

        // Temperature preferences (40% of total score)
        if (preferences.avgTemp.HasValue)
        {
            var tempDiff = Math.Abs(city.AvgAnnualTemp - preferences.avgTemp.Value);
            var tempScore = Math.Max(0, 100 - (tempDiff * 5)); // Lose 5 points per degree difference
            score += tempScore * 0.4;
            maxScore += 100 * 0.4;
        }

        // Summer maximum temperature (20% of total score)
        if (preferences.maxSummer.HasValue)
        {
            var summerDiff = Math.Abs(city.SummerMaxTemp - preferences.maxSummer.Value);
            var summerScore = Math.Max(0, 100 - (summerDiff * 3)); // Lose 3 points per degree difference
            score += summerScore * 0.2;
            maxScore += 100 * 0.2;
        }

        // Winter minimum temperature (20% of total score)
        if (preferences.minWinter.HasValue)
        {
            var winterDiff = Math.Abs(city.WinterMinTemp - preferences.minWinter.Value);
            var winterScore = Math.Max(0, 100 - (winterDiff * 3)); // Lose 3 points per degree difference
            score += winterScore * 0.2;
            maxScore += 100 * 0.2;
        }

        // Temperature variation preference (10% of total score)
        if (preferences.tempVariation.HasValue)
        {
            var variationScore = preferences.tempVariation.Value switch
            {
                <= 2 => city.TemperatureRange <= 20 ? 100 : Math.Max(0, 100 - (city.TemperatureRange - 20) * 2),
                >= 8 => city.TemperatureRange >= 40 ? 100 : Math.Max(0, 100 - (40 - city.TemperatureRange) * 2),
                _ => 80 // Moderate preference gets 80 points for any city
            };
            score += variationScore * 0.1;
            maxScore += 100 * 0.1;
        }

        // Precipitation preference (10% of total score)
        if (!string.IsNullOrEmpty(preferences.precipitation))
        {
            var precipScore = preferences.precipitation.ToLower() switch
            {
                "low" => city.AnnualPrecipitation <= 10 ? 100 : Math.Max(0, 100 - (city.AnnualPrecipitation - 10) * 3),
                "high" => city.AnnualPrecipitation >= 20 ? 100 : Math.Max(0, 100 - (20 - city.AnnualPrecipitation) * 3),
                "moderate" => Math.Abs(city.AnnualPrecipitation - 15) <= 5 ? 100 : Math.Max(0, 100 - Math.Abs(city.AnnualPrecipitation - 15) * 5),
                _ => 80 // No preference gets 80 points
            };
            score += precipScore * 0.1;
            maxScore += 100 * 0.1;
        }

        // Favorite cities bonus (can boost score)
        if (preferences.favoriteCities != null && preferences.favoriteCities.Length > 0)
        {
            foreach (var favCity in preferences.favoriteCities)
            {
                if (city.CityName.Equals(favCity, StringComparison.OrdinalIgnoreCase) ||
                    city.Country.Equals(favCity, StringComparison.OrdinalIgnoreCase))
                {
                    score += 20; // 20 point bonus for favorite cities
                    break;
                }
            }
        }

        // Normalize score to 0-100 range
        return maxScore > 0 ? Math.Min(100, (score / maxScore) * 100) : 0;
    }

    private string GenerateSummary(CityClimate city, OnboardingRequest preferences)
    {
        var lines = new List<string>();

        // Hemisphere information
        if (!string.IsNullOrEmpty(city.Hemisphere))
        {
            lines.Add($"Hemisphere: {city.Hemisphere} Hemisphere");
        }

        // Temperature variation
        string tempDiffDesc;
        if (city.TemperatureRange < 20)
            tempDiffDesc = "Small";
        else if (city.TemperatureRange > 40)
            tempDiffDesc = "Large";
        else
            tempDiffDesc = "Moderate";
        
        lines.Add($"Seasonal temperature differences: {tempDiffDesc}");

        // Summer and winter temperature info
        lines.Add($"Summer average temperature: {city.SummerTemp:F1} °C");
        lines.Add($"Winter average temperature: {city.WinterTemp:F1} °C");

        // Precipitation level
        string precipitationLevel;
        if (city.AnnualPrecipitation < 8)
            precipitationLevel = "Low";
        else if (city.AnnualPrecipitation > 20)
            precipitationLevel = "High";
        else
            precipitationLevel = "Moderate";

        lines.Add($"Precipitation: {precipitationLevel} overall");

        // Add driest or wettest season info
        if (city.AnnualPrecipitation < 15 && !string.IsNullOrEmpty(city.DriestSeason))
        {
            lines.Add($"Driest season: {char.ToUpper(city.DriestSeason[0])}{city.DriestSeason.Substring(1)}");
        }
        else if (city.AnnualPrecipitation >= 15 && !string.IsNullOrEmpty(city.WettestSeason))
        {
            lines.Add($"Wettest season: {char.ToUpper(city.WettestSeason[0])}{city.WettestSeason.Substring(1)}");
        }

        return string.Join("\n", lines);
    }
}
