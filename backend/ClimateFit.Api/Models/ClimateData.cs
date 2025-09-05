using System.Text.Json.Serialization;

namespace ClimateFit.Api.Models;

public class ClimateRecord
{
    [JsonPropertyName("city_name")]
    public string CityName { get; set; } = string.Empty;

    [JsonPropertyName("country_code")]
    public string CountryCode { get; set; } = string.Empty;

    [JsonPropertyName("QUARTER")]
    public string Quarter { get; set; } = string.Empty;

    [JsonPropertyName("MONTH")]
    public int Month { get; set; }

    [JsonPropertyName("MONTH_NAME")]
    public string MonthName { get; set; } = string.Empty;

    [JsonPropertyName("ADJUSTED_MONTH")]
    public int AdjustedMonth { get; set; }

    [JsonPropertyName("SEASON")]
    public string Season { get; set; } = string.Empty;

    [JsonPropertyName("TMAX")]
    public double? Tmax { get; set; }

    [JsonPropertyName("TMIN")]
    public double? Tmin { get; set; }

    [JsonPropertyName("TAVG")]
    public double? Tavg { get; set; }

    [JsonPropertyName("PRCP")]
    public double? Prcp { get; set; }

    [JsonPropertyName("station_count")]
    public int StationCount { get; set; }

    [JsonPropertyName("avg_distance")]
    public double AvgDistance { get; set; }

    [JsonPropertyName("avg_lat")]
    public double AvgLat { get; set; }

    [JsonPropertyName("avg_lon")]
    public double AvgLon { get; set; }

    [JsonPropertyName("hemisphere")]
    public string Hemisphere { get; set; } = string.Empty;

    [JsonPropertyName("ADJUSTED_QUARTER")]
    public string AdjustedQuarter { get; set; } = string.Empty;

    [JsonPropertyName("YEAR")]
    public int Year { get; set; }

    [JsonPropertyName("country_full")]
    public string CountryFull { get; set; } = string.Empty;
}

public class CityClimateData
{
    public string CityName { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Quarter { get; set; } = string.Empty;
    public double? Temperature { get; set; }
    public double? Precipitation { get; set; }
    public double? MaxTemp { get; set; }
    public double? MinTemp { get; set; }
}
