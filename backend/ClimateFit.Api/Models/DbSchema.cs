
namespace ClimateFit.Api.Models;
public class DbSchema{
  public Dictionary<string,User> Users {get;set;} = new();
  public List<Submission> Submissions {get;set;} = new();
}
public class User{
  public string Email {get;set;} = "";
  public string Username {get;set;} = "";
  public string PasswordHash {get;set;} = "";
  public object? Preferences {get;set;}
  public List<HistoryItem> History {get;set;} = new();
}
public class Submission{
  public DateTimeOffset Time {get;set;}
  public string Email {get;set;} = "anonymous@local";
  public object? Onboarding {get;set;}
  public string[] Cities {get;set;} = Array.Empty<string>();
}
