namespace ClimateFit.Api.Models; 

public record OnboardingRequest(
    int? avgTemp,
    int? maxSummer, 
    int? minWinter,
    int? tempVariation,
    string? precipitation,
    string? humidity,
    string[]? favoriteCities,
    bool? save
);
