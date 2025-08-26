
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ClimateFit.Api.Services;
public class JwtService{
  private readonly string _issuer; private readonly string _aud; private readonly string _secret;
  public JwtService(IConfiguration cfg){
    _issuer = cfg["Jwt:Issuer"] ?? "ClimateFit";
    _aud = cfg["Jwt:Audience"] ?? "ClimateFitUsers";
    _secret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? cfg["Jwt:Secret"] ?? "CHANGE_ME_DEV_JWT_SECRET";
  }
  public string Create(string email, TimeSpan? life=null){
    var key=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
    var creds=new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var now=DateTime.UtcNow; var exp=now.Add(life??TimeSpan.FromDays(7));
    var token=new JwtSecurityToken(_issuer,_aud,new[]{ new Claim(JwtRegisteredClaimNames.Sub,email), new Claim(JwtRegisteredClaimNames.Email,email)}, now, exp, creds);
    return new JwtSecurityTokenHandler().WriteToken(token);
  }
}
