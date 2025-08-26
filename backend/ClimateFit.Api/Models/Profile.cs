namespace ClimateFit.Api.Models; public record ProfileDto(string Email,string? Username,object? Preferences, List<HistoryItem> History); public record HistoryItem(string[] Cities,string Date);
