namespace ClimateFit.Api.Models;

public class CityClimate
{
    public string CityCountry { get; set; } = "";
    public string Coordinates { get; set; } = "";
    public double AnnualPrecipitation { get; set; }
    public double AutumnPrecipitation { get; set; }
    public double AutumnTemp { get; set; }
    public double AvgAnnualTemp { get; set; }
    public string CityName { get; set; } = "";
    public string ClimateType { get; set; } = "";
    public string Country { get; set; } = "";
    public int DataYears { get; set; }
    public string DriestSeason { get; set; } = "";
    public string Hemisphere { get; set; } = "";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double SpringPrecipitation { get; set; }
    public double SpringTemp { get; set; }
    public double SummerMaxTemp { get; set; }
    public double SummerPrecipitation { get; set; }
    public double SummerTemp { get; set; }
    public double TemperatureRange { get; set; }
    public int TotalRecords { get; set; }
    public string WettestSeason { get; set; } = "";
    public double WinterMinTemp { get; set; }
    public double WinterPrecipitation { get; set; }
    public double WinterTemp { get; set; }
}

public class CityRecommendation
{
    public string CityName { get; set; } = "";
    public string Country { get; set; } = "";
    public double Score { get; set; }
    public string Summary { get; set; } = "";
    public CityClimate ClimateData { get; set; } = new();
}
