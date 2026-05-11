using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using api.Interface;
using api.Models;
using Microsoft.IdentityModel.Tokens;

namespace api.Services;

//parantez icindeki parametre tum sinif icinde kullanilabilir hale gelir
public class TokenService(IConfiguration config) : ITokenService
{
    private readonly SymmetricSecurityKey _key = CreateSigningKey(config["JWT:SigningKey"]);

    public string CreateToken(AppUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.GivenName, user.UserName!),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
        };
        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddDays(7),
            SigningCredentials = creds,
            Issuer = config["JWT:Issuer"], // _config yerine doğrudan parametreyi kullanıyoruz
            Audience = config["JWT:Audience"],
        };
        var tokenHandler = new JwtSecurityTokenHandler();
        tokenHandler.OutboundClaimTypeMap.Clear();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static SymmetricSecurityKey CreateSigningKey(string? signingKey)
    {
        if (string.IsNullOrWhiteSpace(signingKey))
            throw new InvalidOperationException("JWT:SigningKey is not configured.");

        var keyBytes = Encoding.UTF8.GetBytes(signingKey);

        if (keyBytes.Length <= 64)
            throw new InvalidOperationException(
                "JWT:SigningKey must be longer than 64 bytes for HmacSha512Signature."
            );

        return new SymmetricSecurityKey(keyBytes);
    }
}
